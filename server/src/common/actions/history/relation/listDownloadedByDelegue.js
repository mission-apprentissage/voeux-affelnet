const { RelationActions } = require("../../../constants/History");
const { Relation, Delegue } = require("../../../model");

const saveListDownloadedByDelegue = async ({ uai, siret }) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
  }).lean();

  const delegue = await Delegue.findOne({
    relations: {
      $elemMatch: {
        "etablissement_formateur.uai": uai,
        "etablissement_responsable.siret": siret,
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
          action: RelationActions.LIST_DOWNLOADED_BY_DELEGUE,
          variables: {
            delegue,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListDownloadedByDelegue,
};
