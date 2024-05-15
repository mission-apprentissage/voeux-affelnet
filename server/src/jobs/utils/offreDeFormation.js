const logger = require("../../common/logger.js");
const { compose, transformData, filterData, accumulateData, flattenArray } = require("oleoduc");
const { Responsable /*Etablissement*/ } = require("../../common/model/index.js");
const { catalogue } = require("./catalogue.js");
const { getSiretResponsableFromCleMinistereEducatif } = require("../../common/utils/cleMinistereEducatifUtils.js");
const { getCsvContent } = require("./csv.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");

const SIRET_RECENSEMENT = "99999999999999";

const fixOffreDeFormation = async (originalCsv, overwriteCsv) => {
  // console.log("originalCsv", originalCsv);
  // console.log("overwriteCsv", overwriteCsv);

  const overwriteArray = await getCsvContent(overwriteCsv);

  console.log(overwriteArray);

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
      if (overwriteArray) {
        const academie = data["ACADEMIE"];
        const code_offre = data["CODE_OFFRE"];
        const affelnet_id = `${academie}/${code_offre}`;

        const overwriteItem = overwriteArray.find((item) => item["Affelnet_id"] === affelnet_id);
        if (overwriteItem) {
          logger.warn(`Données écrasées pour la formation ${affelnet_id}`, {
            SIRET_UAI_GESTIONNAIRE: overwriteItem["Siret responsable"],
            UAI_FORMATEUR: overwriteItem["UAI formateur"],
          });

          return {
            ...data,
            SIRET_UAI_GESTIONNAIRE: overwriteItem["Siret responsable"],
            UAI_FORMATEUR: overwriteItem["UAI formateur"],
          };
        }
      }

      return data;
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

  console.log({ affelnet, overwrite });

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
          : getSiretResponsableFromCleMinistereEducatif(cle_ministere_educatif, data["SIRET_UAI_GESTIONNAIRE"]);
        const uai_accueil = data["UAI"]?.toUpperCase();
        let uai_formateur = data["UAI_FORMATEUR"]?.toUpperCase();
        // let uai_responsable = data["UAI_RESPONSABLE"]?.toUpperCase();

        const academie = data["ACADEMIE"];
        const code_offre = data["CODE_OFFRE"];
        const affelnet_id = `${academie}/${code_offre}`;

        if (siret_responsable === SIRET_RECENSEMENT) {
          logger.debug(`${affelnet_id} / Siret recensement détecté pour l'uai_accueil d'accueil ${uai_accueil}`);
          return accumulator;
        }

        try {
          if (!uai_formateur?.length) {
            // logger.debug(
            //   `${affelnet_id} / Recherche de l'UAI formateur pour ${uai_accueil} (${cle_ministere_educatif}, ${siret_responsable})`
            // );
            logger.debug(`${affelnet_id} / Recherche de l'UAI formateur`);

            const formation = await findFormation({ affelnet_id });

            uai_formateur = formation?.etablissement_formateur_uai;
            // uai_formateur = (
            //   await searchFormateurUai({ cle_ministere_educatif, siret_responsable, uai_accueil })
            // )?.uai_formateur?.toUpperCase();

            if (!uai_formateur?.length) {
              logger.error(`${affelnet_id} / UAI formateur introuvable`);
              // logger.error(
              //   `${affelnet_id} / UAI formateur introuvable pour l'UAI d'accueil ${uai_accueil} (${cle_ministere_educatif}, ${siret_responsable})`
              // );
              return accumulator;
            } else {
              logger.info(`${affelnet_id} / UAI formateur trouvé pour ${uai_accueil} : ${uai_formateur}`);
            }
          }

          if (!siret_responsable?.length) {
            logger.debug(`${affelnet_id} / Recherche du siret responsable`);

            const formation = await findFormation({ affelnet_id });

            siret_responsable = formation?.etablissement_gestionnaire_siret;

            if (!siret_responsable?.length) {
              logger.error(`${affelnet_id} / siret responsable introuvable`);

              return accumulator;
            } else {
              logger.info(`${affelnet_id} / siret responsable trouvé : ${siret_responsable}`);
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
            logger.debug(
              `${affelnet_id} / UAI formateur ${uai_formateur} on multiple SIRET : ${uniqueSirets.join(" / ")}`
            );
            // return accumulator;
          }

          if (
            !accumulator.filter(
              (acc) =>
                acc.affelnet_id === affelnet_id &&
                acc.uai_formateur === uai_formateur &&
                acc.siret_responsable === siret_responsable
            ).length
          ) {
            accumulator.push({ uai_formateur, affelnet_id, siret_responsable });
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
    // transformData(async (data) => {
    //   logger.info(data);
    //   return data;
    // }),
    // transformData(
    //   async ({ uai_formateur, cle_ministere_educatif, siret_responsable }) => {
    //     if (!uai_formateur?.length || !cle_ministere_educatif?.length || !siret_responsable?.length) {
    //       logger.warn("Informations manquantes : ", {
    //         uai_formateur,
    //         cle_ministere_educatif,
    //         siret_responsable,
    //       });
    //     }

    //     try {
    //       if (siret_responsable === SIRET_RECENSEMENT) {
    //         return {
    //           uai_formateurs: uai_formateur?.toUpperCase(),
    //           siret_responsable: SIRET_RECENSEMENT,
    //           email_responsable: process.env.VOEUX_AFFELNET_EMAIL,
    //         };
    //       }

    //       if (siret_responsable) {
    //         const responsable = await Responsable.findOne({ siret: siret_responsable });
    //         // const responsable = await Etablissement.findOne({ siret: siret_responsable });

    //         if (responsable) {
    //           return {
    //             uai_formateurs: uai_formateur?.toUpperCase(),
    //             siret_responsable: responsable.siret,
    //             email_responsable: responsable.email?.toLowerCase(),
    //           };
    //         }
    //       }

    //       try {
    //         const { siret, email, alternatives } = await searchResponsableSiretAndEmail({
    //           uai_formateur,
    //           cle_ministere_educatif,
    //           siret_responsable,
    //         });

    //         logger.info("Informations trouvées : ", {
    //           uai_formateurs: uai_formateur?.toUpperCase(),
    //           siret_responsable: siret,
    //           email_responsable: email?.toLowerCase(),
    //           alternatives,
    //         });

    //         return {
    //           uai_formateurs: uai_formateur?.toUpperCase(),
    //           siret_responsable: siret,
    //           email_responsable: email?.toLowerCase(),
    //           alternatives,
    //         };
    //       } catch (e) {
    //         return {
    //           uai_formateurs: uai_formateur?.toUpperCase(),
    //           siret_responsable: null,
    //           email_responsable: null,
    //           alternatives: [],
    //         };
    //       }
    //     } catch (e) {
    //       logger.error(
    //         { err: e },
    //         `Une erreur est survenue lors du traitement de la ligne { uai_formateur: ${uai_formateur}, cle_ministere_educatif: ${cle_ministere_educatif}, siret_responsable: ${siret_responsable} }`
    //       );
    //     }
    //   },
    //   { parallel: 10 }
    // ),

    transformData(
      async ({ uai_formateur, affelnet_id, siret_responsable }) => {
        if (!uai_formateur?.length || !affelnet_id?.length || !siret_responsable?.length) {
          logger.warn("Informations manquantes : ", {
            uai_formateur,
            affelnet_id,
            siret_responsable,
          });
        }

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
            const formation = await findFormation({
              affelnet_id,
            });

            // logger.info("Informations trouvées : ", {
            //   uai_formateurs: uai_formateur?.toUpperCase(),
            //   siret_responsable: formation?.etablissement_gestionnaire_siret,
            //   email_responsable: formation?.etablissement_gestionnaire_courriel?.toLowerCase(),
            // });

            return {
              uai_formateurs: uai_formateur?.toUpperCase(),
              siret_responsable: formation?.etablissement_gestionnaire_siret,
              email_responsable: formation?.etablissement_gestionnaire_courriel?.toLowerCase(),
            };
          } catch (e) {
            return {
              uai_formateurs: uai_formateur?.toUpperCase(),
              siret_responsable: null,
              email_responsable: null,
            };
          }
        } catch (e) {
          logger.error(
            { err: e },
            `Une erreur est survenue lors du traitement de la ligne { uai_formateur: ${uai_formateur}, affelnet_id: ${affelnet_id}, siret_responsable: ${siret_responsable} }`
          );
        }
      },
      { parallel: 10 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { streamOffreDeFormation };
