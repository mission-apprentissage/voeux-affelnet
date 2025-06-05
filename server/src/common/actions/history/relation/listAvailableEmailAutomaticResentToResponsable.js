const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailAutomaticResentToResponsable = async ({ relation, responsable }) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT_TO_RESPONSABLE,
          variables: {
            nombre_voeux: relation.nombre_voeux,
            email: responsable.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticResentToResponsable,
};
