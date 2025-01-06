const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationCreatedByAdmin = async ({ uai_responsable, uai_formateur, email }, admin) => {
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
          action: RelationActions.DELEGATION_CREATED_BY_ADMIN,
          variables: {
            uai_responsable,
            uai_formateur,
            email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationCreatedByAdmin,
};
