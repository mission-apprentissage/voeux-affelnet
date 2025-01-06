const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailManualSentToDelegue = async ({ relation, delegue }, admin) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_DELEGUE,
          variables: {
            nombre_voeux: relation.nombre_voeux,
            email: delegue.email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailManualSentToDelegue,
};
