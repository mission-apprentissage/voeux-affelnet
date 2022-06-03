const { Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV, transformData } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { loadRelations } = require("../common/relations.js");
const { ouiNon } = require("../common/utils/csvUtils.js");

async function exportEtablissementsInconnus(output, options = {}) {
  const relations = options.relations ? await loadRelations() : [];

  await oleoduc(
    Voeu.aggregate([
      {
        $group: {
          _id: "$etablissement_accueil.uai",
          uai: { $first: "$etablissement_accueil.uai" },
          nom: { $first: "$etablissement_accueil.nom" },
          ville: { $first: "$etablissement_accueil.ville" },
          academie: { $first: "$academie.nom" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "etablissements.uai",
          as: "cfas",
        },
      },
      {
        $match: {
          "cfas.0": {
            $exists: false,
          },
        },
      },
      {
        $project: {
          _id: 0,
          cfas: 0,
        },
      },
    ]).cursor(),
    transformData((data) => {
      return {
        ...data,
        ...(options.relations
          ? {
              "Présents dans l'offre de formation AFFELNET": ouiNon(
                Object.values(relations)
                  .flatMap((v) => v)
                  .includes(data.uai)
              ),
              "Siret gestionnaire inconnu dans l'offre de formation AFFELNET": ouiNon(relations[""].includes(data.uai)),
            }
          : {}),
      };
    }),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = exportEtablissementsInconnus;
