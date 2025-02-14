const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountActivationEmailManualSent = async ({ siret, email }, admin) => {
  await Etablissement.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT,
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
  saveAccountActivationEmailManualSent,
};
