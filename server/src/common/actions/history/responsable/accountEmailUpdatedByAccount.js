const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveAccountEmailUpdatedByAccount = async ({ _id }, new_email, old_email) => {
  await Responsable.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT,
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
