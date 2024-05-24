const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountActivated = async ({ _id, email }) => {
  await Delegue.updateOne(
    { _id },
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
