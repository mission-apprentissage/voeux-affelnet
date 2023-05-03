const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountConfirmationEmailManualResent = async ({ siret, email }, admin) => {
  await Formateur.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT,
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
  saveAccountConfirmationEmailManualResent,
};
