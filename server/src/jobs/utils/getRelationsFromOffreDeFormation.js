const CatalogueApi = require("../../common/api/CatalogueApi.js");
const ReferentielApi = require("../../common/api/ReferentielApi.js");
const logger = require("../../common/logger.js");
const { uniq } = require("lodash");
const { compose, transformData, filterData } = require("oleoduc");
const { Cfa } = require("../../common/model/index.js");
const { getFromStorage } = require("../../common/utils/ovhUtils.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");

async function getOffreDeFormationCsv(offreDeFormationCsv) {
  const stream = offreDeFormationCsv || (await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-02-05-2022.csv"));

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

function referentiel() {
  const referentielApi = new ReferentielApi();

  return {
    findEmailReferentiel: async (siret) => {
      try {
        let organisme = await referentielApi.getOrganisme(siret);

        return organisme?.contacts.find((c) => c.confirmé === true)?.email || organisme?.contacts[0]?.email;
      } catch (e) {
        logger.error(e, `Une erreur est survenue lors de l'appel au référentiel pour le siret ${siret}`);
        return null;
      }
    },

    findSiretResponsableReferentiel: async (uai) => {
      try {
        let { organismes } = await referentielApi.searchOrganismes({ uai });

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
      } catch (e) {
        logger.error(e, `Une erreur est survenue lors de l'appel au référentiel pour l'UAI ${uai}`);
        return null;
      }
    },
  };
}

function catalogue() {
  const catalogueApi = new CatalogueApi();

  return {
    findFormations: async (uai, cleMinistereEducation, siretGestionnaire) => {
      const { formations } = await catalogueApi.getFormations(
        {
          published: true,
          ...(cleMinistereEducation ? { cle_ministere_educatif: cleMinistereEducation } : {}),
          $or: [
            { etablissement_formateur_uai: uai },
            { etablissement_gestionnaire_uai: uai },
            { uai_formation: uai, affelnet_published_date: { $ne: null } }, //Evite les collisions avec les uai de formation ParcourSup
            ...(siretGestionnaire ? [{ etablissement_gestionnaire_siret: siretGestionnaire }] : []),
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
        sirets: uniq(formations.map((f) => f.etablissement_gestionnaire_siret)),
        emails: uniq(formations.flatMap((f) => f.etablissement_gestionnaire_courriel?.split("##"))),
      };

      return { formations, alternatives };
    },
  };
}
function filterConflicts(onConflict = () => ({})) {
  const memo = [];

  return filterData((relation) => {
    const { uai_etablissement, siret_gestionnaire, alternatives } = relation;
    const hasConflicts = !siret_gestionnaire || alternatives?.sirets?.length > 1 || alternatives?.emails?.length > 1;
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
  const { findEmailReferentiel, findSiretResponsableReferentiel } = referentiel();
  const { findFormations } = catalogue();
  const { onConflict = () => ({}) } = options;

  async function searchSiretAndEmail(uai, cleMinistereEducation, siretGestionnaire) {
    const { formations, alternatives } = await findFormations(uai, cleMinistereEducation, siretGestionnaire);

    const siret =
      siretGestionnaire ||
      formations[0]?.etablissement_gestionnaire_siret ||
      (await findSiretResponsableReferentiel(uai));

    const email =
      formations[0]?.etablissement_gestionnaire_courriel?.split("##")[0] || (await findEmailReferentiel(siret));

    return {
      siret,
      email,
      alternatives,
    };
  }

  let currentLine = 1;
  return compose(
    await getOffreDeFormationCsv(options.offreDeFormationCsv),
    transformData(
      async (data) => {
        try {
          currentLine++;
          const uai = data["UAI"];
          const cleMinistereEducation = data["CLE_MINISTERE_EDUCATIF"];
          const siretGestionnaire = data["SIRET_UAI_GESTIONNAIRE"];
          const cfa = await Cfa.findOne({ siret: siretGestionnaire });

          if (cfa) {
            return {
              uai_etablissement: uai,
              siret_gestionnaire: cfa.siret,
              email_gestionnaire: cfa.email,
            };
          }

          const { siret, email, alternatives } = await searchSiretAndEmail(
            uai,
            cleMinistereEducation,
            siretGestionnaire
          );

          return {
            uai_etablissement: uai,
            siret_gestionnaire: siret,
            email_gestionnaire: email,
            alternatives,
          };
        } catch (e) {
          logger.error(
            { err: e },
            `Une erreur est survenue lors du traitement de la ligne ${currentLine} avec l'uai ${data["uai"]}`
          );
        }
      },
      { parallel: 5 }
    ),
    filterConflicts(onConflict)
  );
}

module.exports = { getRelationsFromOffreDeFormation };
