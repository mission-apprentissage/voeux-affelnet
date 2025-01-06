const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCreatedByResponsable = async ({ uai_responsable, uai_formateur, email }, responsable) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.uai": uai_formateur,
    "etablissement_responsable.uai": uai_responsable,
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
            uai_formateur,
            uai_responsable,
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
