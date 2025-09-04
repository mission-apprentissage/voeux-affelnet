const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListDownloadedByAdmin = async ({ siret_responsable, siret_formateur, admin, comment }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.siret": siret_responsable,
    "etablissement_formateur.siret": siret_formateur,
  }).lean();

  if (!relation || !admin) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_DOWNLOADED_BY_ADMIN,
          variables: {
            admin,
            comment,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListDownloadedByAdmin,
};
