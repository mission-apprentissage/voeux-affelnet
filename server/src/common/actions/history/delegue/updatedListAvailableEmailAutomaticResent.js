const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticResent = async ({ uai, email }) => {
  await Delegue.updateOne(
    { uai },
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
