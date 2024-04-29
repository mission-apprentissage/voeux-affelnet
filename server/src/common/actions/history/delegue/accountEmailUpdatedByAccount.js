const { DelegueActions } = require("../../../constants/History");
const { Delegue } = require("../../../model");

const saveAccountEmailUpdatedByAccount = async ({ _id }, new_email, old_email) => {
  await Delegue.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: DelegueActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT,
          variables: {
            new_email,
            old_email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountEmailUpdatedByAccount,
};
