const logger = require("../../common/logger.js");
const { compose, transformData, filterData, accumulateData, flattenArray } = require("oleoduc");
const { Responsable /*Etablissement*/ } = require("../../common/model/index.js");
const { getFromStorage } = require("../../common/utils/ovhUtils.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");
const { catalogue } = require("./catalogue.js");
const { referentiel } = require("./referentiel.js");
const { getSiretResponsableFromCleMinistereEducatif } = require("../../common/utils/cleMinistereEducatifUtils.js");

const SIRET_RECENSEMENT = "99999999999999";

async function getOffreDeFormationCsv(csv) {
  const stream = csv || (await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-07-06-2022.csv"));

  return compose(
    stream,
    parseCsv({
      on_record: (record) => {
        return Object.keys(record).reduce((acc, curr) => {
          acc[curr] = record[curr].replaceAll(";", ",");
          return acc;
        }, {});
      },
    })
  );
}

function filterConflicts(onConflict = () => ({})) {
  const memo = [];

  return filterData((relation) => {
    const { uai_etablissement, alternatives } = relation;
    const hasConflicts = alternatives?.sirets?.length > 1 || alternatives?.emails?.length > 1;
    if (!hasConflicts) {
      return true;
    }

    if (!memo.includes(uai_etablissement)) {
      memo.push(uai_etablissement);
      onConflict({
        uai: uai_etablissement,
        sirets: alternatives.sirets.join(","),
        emails: alternatives.emails.join(","),
      });
    }
    return false;
  });
}

async function getRelationsFromOffreDeFormation(options = {}) {
  const { findFormateurUai, findResponsableSiretAndEmail } = await catalogue();
  const { findEmailReferentiel, findSiretResponsableReferentiel } = await referentiel();
  const { onConflict = () => ({}), affelnet } = options;

  async function searchResponsableSiretAndEmail({ uai, cle_ministere_educatif, siret_responsable }) {
    logger.debug(`searchResponsableSiretAndEmail '${uai}', '${cle_ministere_educatif}', '${siret_responsable}'`);
    const { formations, alternatives } = await findResponsableSiretAndEmail({
      uai,
      cle_ministere_educatif,
      siret_responsable,
    });

    const siret = siret_responsable.length
      ? siret_responsable
      : formations[0]?.etablissement_gestionnaire_siret ?? (await findSiretResponsableReferentiel(uai));

    const email =
      formations[0]?.etablissement_gestionnaire_courriel?.split("##")[0] || (await findEmailReferentiel(siret));

    if (alternatives.length) {
      logger.warn({ uai, cle_ministere_educatif, siret_responsable, formations, alternatives });
    }

    return {
      siret,
      email,
      alternatives,
    };
  }

  async function searchFormateurUai({ uai, cle_ministere_educatif, siret_responsable }) {
    const { formations, alternatives } = await findFormateurUai({
      uai,
      cle_ministere_educatif,
      siret_responsable,
    });

    if (!formations?.length) {
      logger.warn(`Pas de formations permettant de retrouver l'UAI du formateur à partir de l'UAI du lieu ${uai}`);
      return {
        uai_formateur: null,
        alternatives: [],
      };
    }

    const uai_formateur = formations[0]?.etablissement_formateur_uai;

    if (alternatives.length) {
      logger.warn({ uai, cle_ministere_educatif, siret_responsable, formations, alternatives });
    }

    // if (uai_formateur !== uai) {
    //   logger.info(`${uai_formateur} trouvé à la place de ${uai}`);
    // }

    return {
      uai_formateur,
      alternatives,
    };
  }

  return compose(
    await getOffreDeFormationCsv(affelnet),

    // Permet de n'avoir qu'une ligne pour une unique ensemble {uai / siret_responsable / cle_ministere_educatif}
    accumulateData(
      async (accumulator, data) => {
        const libelleTypeEtablissement = data["LIBELLE_TYPE_ETABLISSEMENT"];

        const cle_ministere_educatif = data["CLE_MINISTERE_EDUCATIF"]?.toUpperCase();
        const siret_responsable = ![
          "SERVICE ACAD ET CENTRES INFO ET ORIENTAT",
          "RECTORAT ET SERVICES RECTORAUX",
          "SERVICES DEPARTEMENTAUX DE L'EN",
        ].includes(libelleTypeEtablissement)
          ? getSiretResponsableFromCleMinistereEducatif(cle_ministere_educatif, data["SIRET_UAI_GESTIONNAIRE"])
          : SIRET_RECENSEMENT;
        const uai = data["UAI"]?.toUpperCase();
        let uai_formateur = data["UAI_FORMATEUR"]?.toUpperCase();

        if (siret_responsable === SIRET_RECENSEMENT) {
          logger.debug(`Siret recensement détecté pour l'uai d'accueil ${uai}, skipping`);
          return accumulator;
        }

        if (!uai_formateur?.length) {
          logger.debug(`Recherche de l'UAI formateur pour ${uai} (${cle_ministere_educatif}, ${siret_responsable})`);
          uai_formateur = (
            await searchFormateurUai({ cle_ministere_educatif, siret_responsable, uai })
          )?.uai_formateur?.toUpperCase();

          if (!uai_formateur?.length) {
            logger.error(
              `UAI formateur introuvable pour l'UAI d'accueil ${uai} (${cle_ministere_educatif}, ${siret_responsable}), skipping`
            );
            return accumulator;
          } else {
            logger.info(`UAI formateur trouvé pour ${uai} : ${uai_formateur}`);
          }
        }

        if (!libelleTypeEtablissement?.length || typeof libelleTypeEtablissement !== "string") {
          logger.error(`${libelleTypeEtablissement} - ${typeof libelleTypeEtablissement}`);
        }

        const existingRelations = accumulator.filter(
          (acc) => acc.uai_formateur === uai_formateur && acc.siret_responsable !== siret_responsable
        );

        const uniqueSirets = [
          ...new Set([siret_responsable, ...existingRelations.map((item) => item.siret_responsable)]),
        ];

        if (uniqueSirets.length > 1) {
          logger.debug(`UAI formateur ${uai_formateur} on multiple SIRET : ${uniqueSirets.join(" / ")}`);
          // return accumulator;
        }

        if (
          !accumulator.filter(
            (acc) =>
              acc.uai_formateur === uai_formateur &&
              acc.cle_ministere_educatif === cle_ministere_educatif &&
              acc.siret_responsable === siret_responsable
          ).length
        ) {
          accumulator.push({ uai_formateur, cle_ministere_educatif, siret_responsable });
        }

        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    // transformData(async (data) => {
    //   logger.info(data);
    //   return data;
    // }),
    transformData(
      async ({ uai_formateur, cle_ministere_educatif, siret_responsable }) => {
        // if (!uai?.length || !cle_ministere_educatif?.length || !siret_responsable?.length) {
        //   logger.warn("Informations manquantes : ", {
        //     uai,
        //     cle_ministere_educatif,
        //     siret_responsable,
        //   });
        // }

        try {
          if (siret_responsable === SIRET_RECENSEMENT) {
            return {
              uai_formateurs: uai_formateur?.toUpperCase(),
              siret_responsable: SIRET_RECENSEMENT,
              email_responsable: process.env.VOEUX_AFFELNET_EMAIL,
            };
          }

          if (siret_responsable) {
            const responsable = await Responsable.findOne({ siret: siret_responsable });
            // const responsable = await Etablissement.findOne({ siret: siret_responsable });

            if (responsable) {
              return {
                uai_formateurs: uai_formateur?.toUpperCase(),
                siret_responsable: responsable.siret,
                email_responsable: responsable.email?.toLowerCase(),
              };
            }
          }

          try {
            const { siret, email, alternatives } = await searchResponsableSiretAndEmail({
              uai_formateur,
              cle_ministere_educatif,
              siret_responsable,
            });

            return {
              uai_formateurs: uai_formateur?.toUpperCase(),
              siret_responsable: siret,
              email_responsable: email?.toLowerCase(),
              alternatives,
            };
          } catch (e) {
            return {
              uai_formateurs: uai_formateur?.toUpperCase(),
              siret_responsable: null,
              email_responsable: null,
              alternatives: [],
            };
          }
        } catch (e) {
          logger.error(
            { err: e },
            `Une erreur est survenue lors du traitement de la ligne { uai_formateur: ${uai_formateur}, cle_ministere_educatif: ${cle_ministere_educatif}, siret_responsable: ${siret_responsable} }`
          );
        }
      },
      { parallel: 10 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { getRelationsFromOffreDeFormation };
