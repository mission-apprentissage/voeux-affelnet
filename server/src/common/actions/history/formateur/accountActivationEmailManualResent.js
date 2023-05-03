const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountActivationEmailManualResent = async ({ siret, email }, admin) => {
  await Formateur.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT,
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
