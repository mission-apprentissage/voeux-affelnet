const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountConfirmationEmailAutomaticSent = async ({ _id, email }) => {
  await Delegue.updateOne(
    { _id },
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
