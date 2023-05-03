const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountConfirmationEmailAutomaticSent = async ({ siret, email }) => {
  await Formateur.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmationEmailAutomaticSent,
};
