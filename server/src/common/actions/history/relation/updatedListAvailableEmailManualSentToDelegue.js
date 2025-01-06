const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveUpdatedListAvailableEmailManualSentToDelegue = async ({ relation, delegue }, admin) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_DELEGUE,
          variables: {
            nombre_voeux: relation.nombre_voeux,
            nombre_voeux_restant: relation.nombre_voeux_restant,
            email: delegue.email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailableEmailManualSentToDelegue,
};
