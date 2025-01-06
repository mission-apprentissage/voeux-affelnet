const { RelationActions } = require("../../../constants/History");
const { Relation } = require("../../../model");

const saveUpdatedListAvailableEmailManualResentToDelegue = async ({ relation, delegue }, admin) => {
  await Relation.updateOne(
    { _id: relation._id },
    {
      $push: {
        histories: {
          action: RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT_TO_DELEGUE,
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
  saveUpdatedListAvailableEmailManualResentToDelegue,
};
