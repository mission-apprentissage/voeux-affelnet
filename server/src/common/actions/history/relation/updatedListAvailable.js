const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveUpdatedListAvailable = async ({ uai, siret, nombre_voeux }) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
  }).lean();

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
