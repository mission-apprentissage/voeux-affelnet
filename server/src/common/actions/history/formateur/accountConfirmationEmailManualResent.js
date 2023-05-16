const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountConfirmationEmailManualResent = async ({ uai, email }, admin) => {
  await Formateur.updateOne(
    { uai },
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
