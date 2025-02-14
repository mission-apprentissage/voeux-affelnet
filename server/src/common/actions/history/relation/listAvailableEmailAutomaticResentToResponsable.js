const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailAutomaticResentToResponsable = async ({
  siret_responsable,
  siret_formateur,
  nombre_voeux,
  email,
}) => {
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
