const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountConfirmationEmailAutomaticResent = async ({ siret, email }) => {
  await Formateur.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmationEmailAutomaticResent,
};
