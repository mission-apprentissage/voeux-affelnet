const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountConfirmationEmailManualResent = async ({ uai, email }, admin) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT,
          variables: {
            email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmationEmailManualResent,
};
