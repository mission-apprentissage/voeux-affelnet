const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveAccountActivationEmailManualResent = async ({ siret, email }, admin) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT,
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
  saveAccountActivationEmailManualResent,
};
