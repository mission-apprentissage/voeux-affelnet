const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveListAvailableEmailAutomaticResent = async ({ _id, email }) => {
  await Delegue.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: DelegueActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticResent,
};
