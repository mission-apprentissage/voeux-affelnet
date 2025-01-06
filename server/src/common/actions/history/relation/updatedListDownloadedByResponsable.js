const { RelationActions } = require("../../../constants/History");
const { Relation, Etablissement } = require("../../../model");

const saveUpdatedListDownloadedByResponsable = async ({ uai_responsable, uai_formateur }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.uai": uai_responsable,
    "etablissement_formateur.uai": uai_formateur,
  }).lean();

  const responsable = await Etablissement.findOne({ uai: uai_responsable }).select({ _id: 0, histories: 0 }).lean();

  if (!relation) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE,
          variables: {
            responsable,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListDownloadedByResponsable,
};
