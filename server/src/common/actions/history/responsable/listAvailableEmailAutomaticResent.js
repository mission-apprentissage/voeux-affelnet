const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveListAvailableEmailAutomaticResent = async ({ siret, email }) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticResent,
};
