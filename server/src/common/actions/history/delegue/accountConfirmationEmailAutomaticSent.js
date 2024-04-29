const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountConfirmationEmailAutomaticSent = async ({ uai, email }) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmationEmailAutomaticSent,
};
