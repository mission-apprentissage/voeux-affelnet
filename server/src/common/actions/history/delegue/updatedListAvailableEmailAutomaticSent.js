const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticSent = async ({ uai, email }) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailableEmailAutomaticSent,
};
