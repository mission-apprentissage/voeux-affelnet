const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveListAvailableEmailManualResent = async ({ uai, email }, admin) => {
  await Delegue.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: DelegueActions.LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
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
  saveListAvailableEmailManualResent,
};
