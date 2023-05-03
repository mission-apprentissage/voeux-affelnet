const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountActivationEmailAutomaticSent = async ({ siret, email }) => {
  await Formateur.updateOne(
    { siret },
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
