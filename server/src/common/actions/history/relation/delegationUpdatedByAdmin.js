const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveDelegationUpdatedByAdmin = async ({ siret_responsable, siret_formateur, email }, admin) => {
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
          action: RelationActions.DELEGATION_UPDATED_BY_ADMIN,
          variables: {
            siret_responsable,
            siret_formateur,
            email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationUpdatedByAdmin,
};
