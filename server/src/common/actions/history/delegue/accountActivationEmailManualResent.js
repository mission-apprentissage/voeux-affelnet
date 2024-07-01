const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountActivationEmailManualResent = async ({ _id, email }, admin) => {
  await Delegue.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT,
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
  saveAccountActivationEmailManualResent,
};
