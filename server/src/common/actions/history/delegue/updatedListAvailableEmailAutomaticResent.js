const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticResent = async ({ _id, email }) => {
  await Delegue.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: DelegueActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailableEmailAutomaticResent,
};
