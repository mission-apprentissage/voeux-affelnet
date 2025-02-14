const { RelationActions } = require("../../../constants/History");
const { Relation, Delegue } = require("../../../model");

const saveUpdatedListDownloadedByDelegue = async ({ siret_responsable, siret_formateur }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.siret": siret_responsable,
    "etablissement_formateur.siret": siret_formateur,
  }).lean();

  const delegue = await Delegue.findOne({
    relations: {
      $elemMatch: {
        "etablissement_responsable.siret": siret_responsable,
        "etablissement_formateur.siret": siret_formateur,
        active: true,
      },
    },
  })
    .select({ _id: 0, histories: 0 })
    .lean();

  if (!relation) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.UPDATED_LIST_DOWNLOADED_BY_DELEGUE,
          variables: {
            delegue,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListDownloadedByDelegue,
};
