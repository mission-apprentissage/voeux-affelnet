const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCancelledByAdmin = async ({ uai, siret, email }, admin) => {
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
          action: RelationActions.DELEGATION_CANCELLED_BY_ADMIN,
          variables: {
            uai,
            siret,
            email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationCancelledByAdmin,
};
