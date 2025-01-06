const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticResentToDelegue = async ({ relation, delegue }) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT_TO_DELEGUE,
          variables: {
            nombre_voeux: relation.nombre_voeux,
            nombre_voeux_restant: relation.nombre_voeux_restant,
            email: delegue.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailableEmailAutomaticResentToDelegue,
};
