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
      const isPresent = Object.values(relations)
        .flatMap((v) => v)
        .includes(data.uai);

      const siretGestionnaire = Object.keys(relations).find((siret) => {
        return relations[siret].find((uai) => uai === data.uai);
      });

      return {
        ...data,
        ...(options.relations
          ? {
              "Présents dans l'offre de formation AFFELNET": ouiNon(isPresent),
              "Siret du gestionnaire dans l'offre de formation AFFELNET": siretGestionnaire,
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
