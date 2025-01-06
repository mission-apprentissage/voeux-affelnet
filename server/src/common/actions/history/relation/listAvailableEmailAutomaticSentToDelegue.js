const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailAutomaticSentToDelegue = async ({ relation, delegue }) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT_TO_DELEGUE,
          variables: {
            nombre_voeux: relation.nombre_voeux,
            email: delegue.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticSentToDelegue,
};
