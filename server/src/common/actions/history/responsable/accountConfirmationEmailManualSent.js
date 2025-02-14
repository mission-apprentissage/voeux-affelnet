const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountConfirmationEmailManualSent = async ({ siret, email }, admin) => {
  await Etablissement.updateOne(
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
