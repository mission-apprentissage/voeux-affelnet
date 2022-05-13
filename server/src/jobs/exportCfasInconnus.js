const { Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");

async function exportCfasInconnus(output) {
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
          foreignField: "uai",
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
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = exportCfasInconnus;
