const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountActivated = async ({ email }) => {
  await Delegue.updateOne(
    { email },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_ACTIVATED,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountActivated,
};
