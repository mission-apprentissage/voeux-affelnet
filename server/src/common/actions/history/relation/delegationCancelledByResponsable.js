const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCancelledByResponsable = async ({ siret_formateur, siret_responsable, email }, responsable) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.siret": siret_formateur,
    "etablissement_responsable.siret": siret_responsable,
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
            siret_responsable,
            siret_formateur,
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
