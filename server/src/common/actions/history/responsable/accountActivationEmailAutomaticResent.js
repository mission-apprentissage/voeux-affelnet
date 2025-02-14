const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountActivationEmailAutomaticResent = async ({ siret, email }) => {
  await Etablissement.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
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
