const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailable = async ({ siret_responsable, siret_formateur, nombre_voeux }) => {
  const relation = await Relation.findOne({
    "etablissement_responsable.siret": siret_responsable,
    "etablissement_formateur.siret": siret_formateur,
  }).lean();

  if (!relation) {
    return;
  }

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_AVAILABLE,
          variables: {
            nombre_voeux,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailable,
};
