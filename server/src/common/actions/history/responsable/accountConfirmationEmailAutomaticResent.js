const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountConfirmationEmailAutomaticResent = async ({ siret, email }) => {
  await Etablissement.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
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
