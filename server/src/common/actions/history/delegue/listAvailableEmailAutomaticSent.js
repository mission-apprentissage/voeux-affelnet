const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveListAvailableEmailAutomaticSent = async ({ _id, email }) => {
  await Delegue.updateOne(
    { _id },
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
