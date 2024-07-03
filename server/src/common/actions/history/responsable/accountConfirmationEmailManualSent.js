const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveAccountConfirmationEmailManualSent = async ({ siret, email }, admin) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT,
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
  saveAccountConfirmationEmailManualSent,
};
