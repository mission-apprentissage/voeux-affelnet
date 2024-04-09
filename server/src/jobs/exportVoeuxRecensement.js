const { Responsable, Voeu, Formateur } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon } = require("../common/utils/csvUtils.js");
const CatalogueApi = require("../common/api/CatalogueApi");

async function exportVoeuxRecensement(output, options = {}) {
  const catalogueApi = new CatalogueApi();
  const columns = options.columns || {};
  const cfa = await Responsable.findOne({ siret: "99999999999999" });

  console.log(cfa);

  await oleoduc(
    Formateur.find({ uai: { $in: cfa.etablissements?.map((e) => e.uai) ?? [] } }).cursor(),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        Académie: (data) => data.academie,
        Uai: (data) => data?.uai,
        "Raison sociale depuis l'offre de formation": async (data) => {
          return data.libelle_etablissement;
        },
        "Raison sociale depuis le catalogue": async (data) => {
          try {
            const etablissement = await catalogueApi.getEtablissement({ uai: data?.uai });
            return etablissement.entreprise_raison_sociale;
          } catch (e) {
            return null;
          }
        },
        "Type de l'établissement": async (data) => {
          return data?.libelle_type_etablissement ?? "";
        },
        Vœux: (data) => ouiNon(data.uai),
        "Nombre de vœux": async (data) =>
          `${await Voeu.countDocuments({
            "etablissement_accueil.uai": data.uai,
          })}`,
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { exportVoeuxRecensement };
