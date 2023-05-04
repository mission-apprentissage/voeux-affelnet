const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountActivationEmailAutomaticResent = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountActivationEmailAutomaticResent,
};
