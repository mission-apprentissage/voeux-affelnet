const logger = require("../../common/logger.js");
const { compose, transformData, filterData, accumulateData, flattenArray } = require("oleoduc");
const { Etablissement } = require("../../common/model/index.js");
const { catalogue } = require("./catalogue.js");
const {
  getSiretResponsableFromCleMinistereEducatif,
  getSiretFormateurFromCleMinistereEducatif,
} = require("../../common/utils/cleMinistereEducatifUtils.js");
const { getCsvContent } = require("./csv.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");

const SIRET_RECENSEMENT = "99999999999999";
const UAI_RECENSEMENT = "0000000A";

const fixOffreDeFormation = async (originalCsv, overwriteCsv) => {
  // console.log("originalCsv", originalCsv);
  // console.log("overwriteCsv", overwriteCsv);

  const overwriteArray = overwriteCsv && (await getCsvContent(overwriteCsv));

  return compose(
    originalCsv,
    parseCsv({
      on_record: (record) => {
        return Object.keys(record).reduce((acc, curr) => {
          acc[curr] = record[curr].replaceAll(";", ",");
          return acc;
        }, {});
      },
    }),

    transformData(async (data) => {
      let overwriteItem;

      if (overwriteArray) {
        const academie = data["ACADEMIE"];
        const code_offre = data["CODE_OFFRE"];
        const affelnet_id = `${academie}/${code_offre}`;

        overwriteItem = overwriteArray.find((item) => item["Affelnet_id"] === affelnet_id);

        if (overwriteItem) {
          logger.warn(`Données écrasées pour la formation ${affelnet_id}`, {
            SIRET_UAI_GESTIONNAIRE: overwriteItem?.["Siret responsable"] ?? data["SIRET_UAI_GESTIONNAIRE"],
            SIRET_UAI_FORMATEUR: overwriteItem?.["Siret formateur"] ?? data["SIRET_UAI_FORMATEUR"],
            UAI_RESPONSABLE: overwriteItem["UAI responsable"]?.toUpperCase(),
            UAI_FORMATEUR: overwriteItem["UAI formateur"]?.toUpperCase(),
          });
        }
      }

      return {
        ...data,
        SIRET_UAI_GESTIONNAIRE: overwriteItem?.["Siret responsable"] ?? data["SIRET_UAI_GESTIONNAIRE"],
        SIRET_UAI_FORMATEUR: overwriteItem?.["Siret formateur"] ?? data["SIRET_UAI_FORMATEUR"],
        UAI_RESPONSABLE: (overwriteItem?.["UAI responsable"] ?? data["UAI_RESPONSABLE"])?.toUpperCase(),
        UAI_FORMATEUR: (overwriteItem?.["UAI formateur"] ?? data["UAI_FORMATEUR"])?.toUpperCase(),
      };
    })
  );
};

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
        uai_accueil: uai_etablissement,
        sirets: alternatives.sirets.join(","),
        emails: alternatives.emails.join(","),
      });
    }
    return false;
  });
}

async function streamOffreDeFormation(options = {}) {
  const { findFormation } = await catalogue();

  const { onConflict = () => ({}), affelnet, overwrite } = options;

  // console.log({ affelnet, overwrite });

  return compose(
    await fixOffreDeFormation(affelnet, overwrite),

    // Permet de n'avoir qu'une ligne pour une unique ensemble {uai_accueil / siret_responsable / cle_ministere_educatif}
    accumulateData(
      async (accumulator, data) => {
        const libelleTypeEtablissement = data["LIBELLE_TYPE_ETABLISSEMENT"];

        const cle_ministere_educatif = data["CLE_MINISTERE_EDUCATIF"]?.toUpperCase();
        let siret_responsable = [
          "SERVICE ACAD ET CENTRES INFO ET ORIENTAT",
          "RECTORAT ET SERVICES RECTORAUX",
          "SERVICES DEPARTEMENTAUX DE L'EN",
          "SERVICES DEPARTEMENTAUX DE L EN",
        ].includes(libelleTypeEtablissement)
          ? SIRET_RECENSEMENT
          : getSiretResponsableFromCleMinistereEducatif(cle_ministere_educatif, data["SIRET_UAI_GESTIONNAIRE"]) ?? "";

        let siret_formateur =
          getSiretFormateurFromCleMinistereEducatif(cle_ministere_educatif, data["SIRET_UAI_FORMATEUR"]) ?? "";

        const uai_accueil = data["UAI"]?.toUpperCase();
        let uai_formateur = data["UAI_FORMATEUR"]?.toUpperCase();
        let uai_responsable = data["UAI_RESPONSABLE"]?.toUpperCase();

        const academie = data["ACADEMIE"];
        const code_offre = data["CODE_OFFRE"];
        const affelnet_id = `${academie}/${code_offre}`;

        if (
          [siret_responsable, siret_formateur].includes(SIRET_RECENSEMENT) ||
          [uai_responsable, uai_formateur].includes(UAI_RECENSEMENT)
        ) {
          logger.debug(`${affelnet_id} / SIRET ou UAI recensement détecté pour l'uai_accueil d'accueil ${uai_accueil}`);
          return accumulator;
        }

        try {
          if (!siret_formateur?.length || !siret_responsable?.length) {
            logger.debug(`${affelnet_id} / Recherche catalogue`);

            let formation;

            if (!formation) {
              formation = await findFormation({ published: true, affelnet_id });
            }

            if (!formation) {
              formation = await findFormation({ affelnet_id });
            }

            !siret_formateur?.length &&
              (siret_formateur = formation?.etablissement_formateur_siret?.toUpperCase() ?? "");
            !uai_formateur?.length && (uai_formateur = formation?.etablissement_formateur_uai?.toUpperCase() ?? "");
            !siret_responsable?.length &&
              (siret_responsable = formation?.etablissement_responsable_siret?.toUpperCase() ?? "");
            !uai_responsable?.length &&
              (uai_responsable = formation?.etablissement_responsable_uai?.toUpperCase() ?? "");
          }

          if (!siret_formateur?.length || !siret_responsable?.length) {
            logger.error(
              `${affelnet_id};${uai_accueil};${uai_formateur};${siret_formateur};${uai_responsable};${siret_responsable}`
            );

            return accumulator;
          }

          if (!libelleTypeEtablissement?.length || typeof libelleTypeEtablissement !== "string") {
            logger.error(`${libelleTypeEtablissement} - ${typeof libelleTypeEtablissement}`);
          }

          const existingRelations = accumulator.filter(
            (acc) => acc.siret_formateur === siret_formateur && acc.siret_responsable !== siret_responsable
          );

          const uniqueResponsables = [
            ...new Set([siret_responsable, ...existingRelations.map((item) => item.siret_responsable)]),
          ];

          if (uniqueResponsables.length > 1) {
            logger.debug(
              `${affelnet_id} / SIRET formateur ${siret_formateur} on multiple SIRET responsable : ${uniqueResponsables.join(
                " / "
              )}`
            );
            // return accumulator;
          }

          if (
            !accumulator.find(
              (acc) =>
                acc.affelnet_id === affelnet_id &&
                acc.siret_formateur === siret_formateur &&
                acc.siret_responsable === siret_responsable
            )
          ) {
            accumulator.push({ affelnet_id, siret_responsable, siret_formateur });
          }

          return accumulator;
        } catch (e) {
          logger.error(`${affelnet_id} / Une erreur est survenue lors du traitement de la ligne`);
          return accumulator;
        }
      },
      { accumulator: [] }
    ),
    flattenArray(),

    transformData(
      async ({ affelnet_id, siret_responsable, siret_formateur }) => {
        if (!affelnet_id?.length || !siret_responsable?.length || !siret_formateur?.length) {
          logger.warn("Informations manquantes : ", {
            affelnet_id,
            siret_responsable,
            siret_formateur,
          });
        }

        try {
          if (siret_responsable === SIRET_RECENSEMENT) {
            return {
              siret_responsable: SIRET_RECENSEMENT,
              siret_formateurs: siret_formateur?.toUpperCase(),
              email_responsable: process.env.VOEUX_AFFELNET_EMAIL,
            };
          }

          if (siret_responsable) {
            const responsable = await Etablissement.findOne({ siret: siret_responsable });

            if (responsable) {
              return {
                siret_responsable: responsable.siret,
                siret_formateurs: siret_formateur?.toUpperCase(),
                email_responsable: responsable.email?.toLowerCase(),
              };
            }
          }

          try {
            const formation = await findFormation({
              affelnet_id,
            });

            // logger.info("Informations trouvées : ", {
            //   siret_formateurs: siret_formateur?.toUpperCase(),
            //   siret_responsable: formation?.etablissement_gestionnaire_siret,
            //   email_responsable: formation?.etablissement_gestionnaire_courriel?.toLowerCase(),
            // });

            return {
              siret_responsable: siret_responsable ?? formation?.etablissement_gestionnaire_siret,
              siret_formateurs: siret_formateur?.toUpperCase(),
              email_responsable: formation?.etablissement_gestionnaire_courriel?.toLowerCase(),
            };
          } catch (e) {
            return {
              siret_responsable: null,
              siret_formateurs: siret_formateur?.toUpperCase(),
              email_responsable: null,
            };
          }
        } catch (e) {
          logger.error(
            { err: e },
            `Une erreur est survenue lors du traitement de la ligne { affelnet_id: ${affelnet_id}, siret_responsable: ${siret_responsable}, siret_formateur: ${siret_formateur} }`
          );
        }
      },
      { parallel: 10 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { streamOffreDeFormation };
