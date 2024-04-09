const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveListAvailableEmailAutomaticSent = async ({ siret, email }) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailableEmailAutomaticSent,
};
