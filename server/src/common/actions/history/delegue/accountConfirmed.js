const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountConfirmed = async ({ _id }, email) => {
  await Delegue.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_CONFIRMED,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmed,
};
