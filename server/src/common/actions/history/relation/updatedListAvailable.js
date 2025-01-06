const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveUpdatedListAvailable = async ({ uai_responsable, uai_formateur, nombre_voeux }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.uai": uai_responsable,
    "etablissement_formateur.uai": uai_formateur,
  }).lean();

  if (!relation) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.UPDATED_LIST_AVAILABLE,
          variables: {
            nombre_voeux,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailable,
};
