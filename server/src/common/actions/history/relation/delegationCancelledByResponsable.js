const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCancelledByResponsable = async ({ uai, siret, email }, responsable) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
  }).lean();

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.DELEGATION_CANCELLED_BY_RESPONSABLE,
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
  saveDelegationCancelledByResponsable,
};
