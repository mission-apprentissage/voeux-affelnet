const CatalogueApi = require("../../common/api/CatalogueApi.js");
const ReferentielApi = require("../../common/api/ReferentielApi.js");
const logger = require("../../common/logger.js");
const { uniq } = require("lodash");
const { compose, transformData, filterData, accumulateData, flattenArray } = require("oleoduc");
const { Gestionnaire } = require("../../common/model/index.js");
const { getFromStorage } = require("../../common/utils/ovhUtils.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");

const referentielApi = new ReferentielApi();
const catalogueApi = new CatalogueApi();

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

const referentiel = async () => {
  const findEmailReferentielCache = new Map();
  const findSiretResponsableReferentiel = new Map();

  return {
    findEmailReferentiel: async (siret) => {
      if (!siret || !siret?.length) {
        return null;
      }
      if (findEmailReferentielCache.has(siret)) {
        return findEmailReferentielCache.get(siret);
      }

      try {
        const result = await (async () => {
          let organisme = await referentielApi.getOrganisme(siret);

          return organisme?.contacts.find((c) => c.confirmé === true)?.email || organisme?.contacts[0]?.email;
        })();

        findEmailReferentielCache.set(siret, result);
        return result;
      } catch (e) {
        logger.error(e, `Une erreur est survenue lors de l'appel au référentiel pour le siret ${siret}`);
        return null;
      }
    },

    findSiretResponsableReferentiel: async (uai) => {
      if (!uai || !uai?.length) {
        return null;
      }
      if (findSiretResponsableReferentiel.has(uai)) {
        return findSiretResponsableReferentiel.get(uai);
      }

      try {
        const result = await (async () => {
          let { organismes } = await referentielApi.searchOrganismes({ uais: uai });

          if (organismes.length === 0) {
            logger.warn(`Impossible de trouver l'organisme ${uai} dans le référentiel`);
            return null;
          }

          const responsable = organismes.find((o) => o.nature !== "formateur");
          if (!responsable) {
            return organismes
              .flatMap((o) => o.relations)
              .filter((r) => r.type === "formateur->responsable")
              .map((r) => r.siret)[0];
          }

          return responsable.siret;
        })();

        findSiretResponsableReferentiel.set(uai, result);

        return result;
      } catch (e) {
        logger.error(e, `Une erreur est survenue lors de l'appel au référentiel pour l'UAI ${uai}`);
        return null;
      }
    },
  };
};

const catalogue = async () => {
  await catalogueApi.connect();

  return {
    findFormations: async (uai, cleMinistereEducatif, siretGestionnaire) => {
      try {
        const { formations } = await catalogueApi.getFormations(
          {
            published: true,
            ...(cleMinistereEducatif ? { cle_ministere_educatif: cleMinistereEducatif } : {}),
            ...(siretGestionnaire ? { etablissement_gestionnaire_siret: siretGestionnaire } : {}),
            $or: [
              // { etablissement_formateur_uai: uai },
              // { etablissement_gestionnaire_uai: uai },
              { uai_formation: uai, affelnet_published_date: { $ne: null } }, //Evite les collisions avec les uai de formation ParcourSup
            ],
          },
          {
            limit: 100,
            select: {
              etablissement_gestionnaire_courriel: 1,
              etablissement_gestionnaire_siret: 1,
            },
          }
        );

        const alternatives = {
          sirets: uniq(formations.map((f) => f.etablissement_gestionnaire_siret)).filter((siret) => !!siret),
          emails: uniq(formations.flatMap((f) => f.etablissement_gestionnaire_courriel?.split("##"))).filter(
            (email) => !!email
          ),
        };

        return { formations, alternatives };
      } catch (e) {
        logger.error(
          e,
          `Une erreur est survenue lors de l'appel au catalogue pour les valeurs ${uai} /
        ${cleMinistereEducatif} /
        ${siretGestionnaire}`
        );
        return null;
      }
    },
  };
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
        uai: uai_etablissement,
        sirets: alternatives.sirets.join(","),
        emails: alternatives.emails.join(","),
      });
    }
    return false;
  });
}

async function getRelationsFromOffreDeFormation(options = {}) {
  const { findEmailReferentiel, findSiretResponsableReferentiel } = await referentiel();
  const { findFormations } = await catalogue();
  const { onConflict = () => ({}), affelnet } = options;

  async function searchSiretAndEmail(uai, cleMinistereEducatif, siretGestionnaire) {
    const { formations, alternatives } = await findFormations(uai, cleMinistereEducatif, siretGestionnaire);

    const siret =
      siretGestionnaire ||
      formations[0]?.etablissement_gestionnaire_siret ||
      (await findSiretResponsableReferentiel(uai));

    const email =
      formations[0]?.etablissement_gestionnaire_courriel?.split("##")[0] || (await findEmailReferentiel(siret));

    // console.log({ uai, siret, email, alternatives });
    return {
      siret,
      email,
      alternatives,
    };
  }

  return compose(
    await getOffreDeFormationCsv(affelnet),

    // Permet de n'avoir qu'une ligne pour une unique ensemble {uai / siretGestionnaire / cleMinistereEducatif}
    accumulateData(
      async (accumulator, data) => {
        const libelleTypeEtablissement = data["LIBELLE_TYPE_ETABLISSEMENT"];

        const uai = data["UAI"]?.toUpperCase();
        const cleMinistereEducatif = data["CLE_MINISTERE_EDUCATIF"]?.toUpperCase();
        const siretGestionnaire = ![
          "RECTORAT ET SERVICES RECTORAUX",
          "SERVICE ACAD ET CENTRES INFO ET ORIENTAT",
          "SERVICES DEPARTEMENTAUX DE L'EN",
        ].includes(libelleTypeEtablissement)
          ? data["SIRET_UAI_GESTIONNAIRE"]
          : SIRET_RECENSEMENT;

        if (!libelleTypeEtablissement?.length || typeof libelleTypeEtablissement !== "string") {
          logger.error(`${libelleTypeEtablissement} - ${typeof libelleTypeEtablissement}`);
        }

        const existingRelations = accumulator.filter(
          (acc) => acc.uai === uai && acc.siretGestionnaire !== siretGestionnaire
        );

        const uniqueSirets = [
          ...new Set([siretGestionnaire, ...existingRelations.map((item) => item.siretGestionnaire)]),
        ];

        if (uniqueSirets.length > 1) {
          logger.warn(`UAI ${uai} on multiple SIRET : ${uniqueSirets.join(" / ")}`);

          // return accumulator;
        }

        if (
          !accumulator.filter(
            (acc) =>
              acc.uai === uai &&
              acc.cleMinistereEducatif === cleMinistereEducatif &&
              acc.siretGestionnaire === siretGestionnaire
          ).length
        ) {
          accumulator.push({ uai, cleMinistereEducatif, siretGestionnaire });
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

          const { siret, email, alternatives } = await searchSiretAndEmail(
            uai,
            cleMinistereEducatif,
            siretGestionnaire
          );

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
      { parallel: 5 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { getRelationsFromOffreDeFormation };
