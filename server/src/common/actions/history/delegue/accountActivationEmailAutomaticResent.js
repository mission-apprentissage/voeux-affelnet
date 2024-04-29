const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountActivationEmailAutomaticResent = async ({ uai, email }) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountActivationEmailAutomaticResent,
};
