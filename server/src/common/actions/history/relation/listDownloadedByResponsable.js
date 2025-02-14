const { RelationActions } = require("../../../constants/History");
const { Relation, Etablissement } = require("../../../model");

const saveListDownloadedByResponsable = async ({ siret_responsable, siret_formateur }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.siret": siret_responsable,
    "etablissement_formateur.siret": siret_formateur,
  }).lean();

  const responsable = await Etablissement.findOne({ siret: siret_responsable }).select({ _id: 0, histories: 0 }).lean();

  if (!relation) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_DOWNLOADED_BY_RESPONSABLE,
          variables: {
            responsable,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListDownloadedByResponsable,
};
