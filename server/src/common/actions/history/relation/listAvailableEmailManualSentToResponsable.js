const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailManualSentToResponsable = async ({ relation, responsable }, admin) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_RESPONSABLE,
          variables: {
            nombre_voeux: relation.nombre_voeux,
            email: responsable.email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailManualSentToResponsable,
};
