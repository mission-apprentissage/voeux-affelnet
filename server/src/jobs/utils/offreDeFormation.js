const logger = require("../../common/logger.js");
const { compose, transformData, filterData, accumulateData, flattenArray } = require("oleoduc");
const { Etablissement } = require("../../common/model/index.js");
const { catalogue } = require("./catalogue.js");
const { getSiretResponsableFromCleMinistereEducatif } = require("../../common/utils/cleMinistereEducatifUtils.js");
const { getCsvContent } = require("./csv.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");

const SIRET_RECENSEMENT = "99999999999999";
const UAI_RECENSEMENT = "0000000A";

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
      let overwriteItem;

      if (overwriteArray) {
        const academie = data["ACADEMIE"];
        const code_offre = data["CODE_OFFRE"];
        const affelnet_id = `${academie}/${code_offre}`;

        overwriteItem = overwriteArray.find((item) => item["Affelnet_id"] === affelnet_id);

        if (overwriteItem) {
          logger.warn(`Données écrasées pour la formation ${affelnet_id}`, {
            // SIRET_UAI_GESTIONNAIRE: overwriteItem?.["Siret responsable"] ?? data["SIRET_UAI_GESTIONNAIRE"],
            // SIRET_UAI_FORMATEUR: overwriteItem?.["Siret formateur"] ?? data["SIRET_UAI_FORMATEUR"],
            UAI_RESPONSABLE: overwriteItem["UAI responsable"]?.toUpperCase(),
            UAI_FORMATEUR: overwriteItem["UAI formateur"]?.toUpperCase(),
          });
        }
      }

      return {
        ...data,
        // SIRET_UAI_GESTIONNAIRE: overwriteItem?.["Siret responsable"] ?? data["SIRET_UAI_GESTIONNAIRE"],
        // SIRET_UAI_FORMATEUR: overwriteItem?.["Siret formateur"] ?? data["SIRET_UAI_FORMATEUR"],
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
        let uai_responsable = data["UAI_RESPONSABLE"]?.toUpperCase();

        const academie = data["ACADEMIE"];
        const code_offre = data["CODE_OFFRE"];
        const affelnet_id = `${academie}/${code_offre}`;

        if (siret_responsable === SIRET_RECENSEMENT || uai_responsable === UAI_RECENSEMENT) {
          logger.debug(`${affelnet_id} / Siret ou UAI recensement détecté pour l'uai_accueil d'accueil ${uai_accueil}`);
          return accumulator;
        }

        try {
          if (!uai_formateur?.length) {
            logger.debug(`${affelnet_id} / Recherche de l'UAI formateur`);

            let formation;

            if (!formation) {
              formation = await findFormation({ published: true, affelnet_id });
            }

            if (!formation) {
              formation = await findFormation({ affelnet_id });
            }

            uai_formateur = formation?.etablissement_formateur_uai?.toUpperCase();

            if (!uai_formateur?.length) {
              logger.error(`${affelnet_id} / UAI formateur introuvable`);
              return accumulator;
            } else {
              logger.info(`${affelnet_id} / UAI formateur trouvé pour ${uai_accueil} : ${uai_formateur}`);
            }
          }

          if (!uai_responsable?.length) {
            logger.debug(`${affelnet_id} / Recherche de l'UAI responsable`);

            const formation = await findFormation({ affelnet_id });

            uai_responsable = formation?.etablissement_gestionnaire_uai?.toUpperCase();

            if (!uai_responsable?.length) {
              logger.error(`${affelnet_id} / uai responsable introuvable`);
              return accumulator;
            } else {
              logger.info(`${affelnet_id} / uai responsable trouvé : ${uai_responsable}`);
            }
          }

          if (!libelleTypeEtablissement?.length || typeof libelleTypeEtablissement !== "string") {
            logger.error(`${libelleTypeEtablissement} - ${typeof libelleTypeEtablissement}`);
          }

          const existingRelations = accumulator.filter(
            (acc) => acc.uai_formateur === uai_formateur && acc.uai_responsable !== uai_responsable
          );

          const uniqueResponsables = [
            ...new Set([uai_responsable, ...existingRelations.map((item) => item.uai_responsable)]),
          ];

          if (uniqueResponsables.length > 1) {
            logger.debug(
              `${affelnet_id} / UAI formateur ${uai_formateur} on multiple UAI responsable : ${uniqueResponsables.join(
                " / "
              )}`
            );
            // return accumulator;
          }

          if (
            !accumulator.find(
              (acc) =>
                acc.affelnet_id === affelnet_id &&
                acc.uai_formateur === uai_formateur &&
                acc.uai_responsable === uai_responsable
            )
          ) {
            accumulator.push({ affelnet_id, uai_responsable, uai_formateur });
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
      async ({ affelnet_id, uai_responsable, uai_formateur }) => {
        if (!affelnet_id?.length || !uai_responsable?.length || !uai_formateur?.length) {
          logger.warn("Informations manquantes : ", {
            affelnet_id,
            uai_responsable,
            uai_formateur,
          });
        }

        try {
          if (uai_responsable === UAI_RECENSEMENT) {
            return {
              uai_responsable: UAI_RECENSEMENT,
              uai_formateurs: uai_formateur?.toUpperCase(),
              email_responsable: process.env.VOEUX_AFFELNET_EMAIL,
            };
          }

          if (uai_responsable) {
            const responsable = await Etablissement.findOne({ uai: uai_responsable });

            if (responsable) {
              return {
                uai_responsable: responsable.uai,
                uai_formateurs: uai_formateur?.toUpperCase(),
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
              uai_responsable: uai_responsable ?? formation?.etablissement_gestionnaire_uai,
              uai_formateurs: uai_formateur?.toUpperCase(),
              email_responsable: formation?.etablissement_gestionnaire_courriel?.toLowerCase(),
            };
          } catch (e) {
            return {
              uai_responsable: null,
              uai_formateurs: uai_formateur?.toUpperCase(),
              email_responsable: null,
            };
          }
        } catch (e) {
          logger.error(
            { err: e },
            `Une erreur est survenue lors du traitement de la ligne { affelnet_id: ${affelnet_id}, uai_responsable: ${uai_responsable}, uai_formateur: ${uai_formateur} }`
          );
        }
      },
      { parallel: 10 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { streamOffreDeFormation };
