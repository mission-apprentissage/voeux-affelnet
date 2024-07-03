const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveListAvailableEmailManualSent = async ({ siret, email }, admin) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT,
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
  saveListAvailableEmailManualSent,
};
