const logger = require("../../common/logger.js");
const { compose, transformData, filterData, accumulateData, flattenArray } = require("oleoduc");
const { Gestionnaire } = require("../../common/model/index.js");
const { getFromStorage } = require("../../common/utils/ovhUtils.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");
const { catalogue } = require("./catalogue.js");
const { referentiel } = require("./referentiel.js");
const { getSiretGestionnaireFromCleMinistereEducatif } = require("../../common/utils/cleMinistereEducatifUtils.js");

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
  const { findFormateurUai, findGestionnaireSiretAndEmail } = await catalogue();
  const { findEmailReferentiel, findSiretResponsableReferentiel } = await referentiel();
  const { onConflict = () => ({}), affelnet } = options;

  async function searchGestionnaireSiretAndEmail({ uai, cleMinistereEducatif, siretGestionnaire }) {
    logger.debug(`searchGestionnaireSiretAndEmail '${uai}', '${cleMinistereEducatif}', '${siretGestionnaire}'`);
    const { formations, alternatives } = await findGestionnaireSiretAndEmail({
      uai,
      cleMinistereEducatif,
      siretGestionnaire,
    });

    const siret = siretGestionnaire.length
      ? siretGestionnaire
      : formations[0]?.etablissement_gestionnaire_siret ?? (await findSiretResponsableReferentiel(uai));

    const email =
      formations[0]?.etablissement_gestionnaire_courriel?.split("##")[0] || (await findEmailReferentiel(siret));

    if (alternatives.length) {
      logger.warn({ uai, cleMinistereEducatif, siretGestionnaire, formations, alternatives });
    }

    return {
      siret,
      email,
      alternatives,
    };
  }

  async function searchFormateurUai({ uai, cleMinistereEducatif, siretGestionnaire }) {
    const { formations, alternatives } = await findFormateurUai({
      uai,
      cleMinistereEducatif,
      siretGestionnaire,
    });

    const uai_formateur = formations[0]?.etablissement_formateur_uai ?? uai;

    if (alternatives.length) {
      logger.warn({ uai, cleMinistereEducatif, siretGestionnaire, formations, alternatives });
    }

    if (uai_formateur !== uai) {
      logger.info(`${uai_formateur} trouvé à la place de ${uai}`);
    }

    return {
      uai_formateur,
      alternatives,
    };
  }

  return compose(
    await getOffreDeFormationCsv(affelnet),

    // Permet de n'avoir qu'une ligne pour une unique ensemble {uai / siretGestionnaire / cleMinistereEducatif}
    accumulateData(
      async (accumulator, data) => {
        const libelleTypeEtablissement = data["LIBELLE_TYPE_ETABLISSEMENT"];

        const cleMinistereEducatif = data["CLE_MINISTERE_EDUCATIF"]?.toUpperCase();
        const siretGestionnaire = ![
          "SERVICE ACAD ET CENTRES INFO ET ORIENTAT",
          "RECTORAT ET SERVICES RECTORAUX",
          "SERVICES DEPARTEMENTAUX DE L'EN",
        ].includes(libelleTypeEtablissement)
          ? getSiretGestionnaireFromCleMinistereEducatif(cleMinistereEducatif, data["SIRET_UAI_GESTIONNAIRE"])
          : SIRET_RECENSEMENT;
        const uai = data["UAI"]?.toUpperCase();

        const { uai_formateur } = await searchFormateurUai({ cleMinistereEducatif, siretGestionnaire, uai });

        if (!libelleTypeEtablissement?.length || typeof libelleTypeEtablissement !== "string") {
          logger.error(`${libelleTypeEtablissement} - ${typeof libelleTypeEtablissement}`);
        }

        const existingRelations = accumulator.filter(
          (acc) => acc.uai === uai_formateur && acc.siretGestionnaire !== siretGestionnaire
        );

        const uniqueSirets = [
          ...new Set([siretGestionnaire, ...existingRelations.map((item) => item.siretGestionnaire)]),
        ];

        if (uniqueSirets.length > 1) {
          logger.warn(`UAI ${uai_formateur} on multiple SIRET : ${uniqueSirets.join(" / ")}`);

          // return accumulator;
        }

        if (
          !accumulator.filter(
            (acc) =>
              acc.uai === uai_formateur &&
              acc.cleMinistereEducatif === cleMinistereEducatif &&
              acc.siretGestionnaire === siretGestionnaire
          ).length
        ) {
          accumulator.push({ uai: uai_formateur, cleMinistereEducatif, siretGestionnaire });
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
      async ({ uai, cleMinistereEducatif, siretGestionnaire }) => {
        // if (!uai?.length || !cleMinistereEducatif?.length || !siretGestionnaire?.length) {
        //   logger.warn("Informations manquantes : ", {
        //     uai,
        //     cleMinistereEducatif,
        //     siretGestionnaire,
        //   });
        // }

        try {
          if (siretGestionnaire === SIRET_RECENSEMENT) {
            return {
              uai_etablissement: uai?.toUpperCase(),
              siret_gestionnaire: SIRET_RECENSEMENT,
              email_gestionnaire: process.env.VOEUX_AFFELNET_EMAIL,
            };
          }

          if (siretGestionnaire) {
            const gestionnaire = await Gestionnaire.findOne({ siret: siretGestionnaire });

            if (gestionnaire) {
              return {
                uai_etablissement: uai?.toUpperCase(),
                siret_gestionnaire: gestionnaire.siret,
                email_gestionnaire: gestionnaire.email?.toLowerCase(),
              };
            }
          }

          const { siret, email, alternatives } = await searchGestionnaireSiretAndEmail({
            uai,
            cleMinistereEducatif,
            siretGestionnaire,
          });

          return {
            uai_etablissement: uai?.toUpperCase(),
            siret_gestionnaire: siret,
            email_gestionnaire: email?.toLowerCase(),
            alternatives,
          };
        } catch (e) {
          logger.error(
            { err: e },
            `Une erreur est survenue lors du traitement de la ligne { uai: ${uai}, cleMinistereEducatif: ${cleMinistereEducatif}, siretGestionnaire: ${siretGestionnaire} }`
          );
        }
      },
      { parallel: 10 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { getRelationsFromOffreDeFormation };
