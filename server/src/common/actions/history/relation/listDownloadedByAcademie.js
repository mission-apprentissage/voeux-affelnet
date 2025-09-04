const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListDownloadedByAcademie = async ({ siret_responsable, siret_formateur, academie, comment }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.siret": siret_responsable,
    "etablissement_formateur.siret": siret_formateur,
  }).lean();

  if (!relation || !academie) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_DOWNLOADED_BY_ACADEMIE,
          variables: {
            academie,
            comment,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListDownloadedByAcademie,
};
