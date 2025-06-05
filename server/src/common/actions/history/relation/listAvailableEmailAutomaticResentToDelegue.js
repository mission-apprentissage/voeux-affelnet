const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveListAvailableEmailAutomaticResentToDelegue = async ({ relation, delegue }) => {
  console.log("saveListAvailableEmailAutomaticResentToDelegue", relation._id);

  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT_TO_DELEGUE,
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
  saveListAvailableEmailAutomaticResentToDelegue,
};
