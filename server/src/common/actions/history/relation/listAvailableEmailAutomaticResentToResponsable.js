const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailAutomaticResentToResponsable = async ({
  uai_responsable,
  uai_formateur,
  nombre_voeux,
  email,
}) => {
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
          action: RelationActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT_TO_RESPONSABLE,
          variables: {
            nombre_voeux,
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticResentToResponsable,
};
