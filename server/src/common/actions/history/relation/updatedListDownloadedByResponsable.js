const { RelationActions } = require("../../../constants/History");
const { Relation, Responsable } = require("../../../model");

const saveUpdatedListDownloadedByResponsable = async ({ uai, siret }) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
  }).lean();

  const responsable = await Responsable.findOne({ siret }).select({ _id: 0, histories: 0 }).lean();

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
