const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCancelledByResponsable = async ({ uai_formateur, uai_responsable, email }, responsable) => {
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
          action: RelationActions.DELEGATION_CANCELLED_BY_RESPONSABLE,
          variables: {
            uai_responsable,
            uai_formateur,
            email,
            responsable: responsable.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationCancelledByResponsable,
};
