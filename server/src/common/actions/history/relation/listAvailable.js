const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailable = async ({ uai, siret, nombre_voeux }) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
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
