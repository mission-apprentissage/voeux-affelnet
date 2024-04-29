const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountConfirmationEmailAutomaticResent = async ({ uai, email }) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmationEmailAutomaticResent,
};
