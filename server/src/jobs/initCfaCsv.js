const { transformData, compose } = require("oleoduc");
const { parseCsv } = require("../common/utils/csvUtils");
const CatalogueApi = require("../common/api/CatalogueApi");
const ReferentielApi = require("../common/api/ReferentielApi");
const { isEmpty, chain, last } = require("lodash");
const { Cfa } = require("../common/model");

function initCfaCsv(input) {
  let catalogueApi = new CatalogueApi();
  let referentielApi = new ReferentielApi();

  let memo = [];
  return compose(
    input,
    parseCsv(),
    transformData((line) => {
      let siret = line.SIRET_UAI_GESTIONNAIRE;
      if (isEmpty(siret) || memo.find((m) => m === siret)) {
        return null;
      }

      memo.push(siret);
      return siret;
    }),
    transformData(
      async (siret) => {
        let [organisme, { formations }] = await Promise.all([
          referentielApi.getOrganisme(siret, {
            champs: "siret,uai,nature,raison_sociale,adresse",
          }),
          catalogueApi.getFormations(
            {
              published: true,
              etablissement_gestionnaire_siret: siret,
            },
            {
              limit: 250,
              select: {
                etablissement_gestionnaire_courriel: 1,
                etablissement_gestionnaire_uai: 1,
              },
            }
          ),
        ]);

        let mostFrequentEmail = chain(formations.map((f) => f.etablissement_gestionnaire_courriel).filter((e) => e))
          .countBy()
          .entries()
          .maxBy(last)
          .head()
          .value();

        let uai = formations.length > 0 ? formations[0].etablissement_gestionnaire_uai : null;
        let cfa = await Cfa.findOne({ uai });

        return {
          uai: uai || "",
          siret: organisme?.siret,
          raison_sociale: organisme?.raison_sociale,
          academie: organisme?.adresse?.academie.nom,
          region: organisme?.adresse?.region.nom,
          nature: organisme?.nature,
          statut: cfa?.statut,
          email_directeur: "",
          email_contact: mostFrequentEmail,
          email_voeux: cfa?.email || "",
          email_voeux_2: cfa?.contacts.join(", ") || "",
        };
      },
      { parallel: 10 }
    )
  );
}

module.exports = initCfaCsv;
