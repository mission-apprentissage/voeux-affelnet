const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountActivationEmailAutomaticSent = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountActivationEmailAutomaticSent,
};
