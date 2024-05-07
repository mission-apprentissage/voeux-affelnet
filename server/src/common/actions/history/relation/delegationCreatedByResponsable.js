const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCreatedByResponsable = async ({ uai, siret, email }, responsable) => {
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
          action: RelationActions.DELEGATION_CREATED_BY_RESPONSABLE,
          variables: {
            uai,
            siret,
            email,
            responsable: responsable.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationCreatedByResponsable,
};
