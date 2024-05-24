const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountActivationEmailAutomaticSent = async ({ _id, email }) => {
  await Delegue.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountActivationEmailAutomaticSent,
};
