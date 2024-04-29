const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveListAvailableEmailAutomaticSent = async ({ uai, email }) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticSent,
};
