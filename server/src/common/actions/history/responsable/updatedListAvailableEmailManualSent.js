const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveUpdatedListAvailableEmailManualSent = async ({ siret, email }, admin) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT,
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
  saveUpdatedListAvailableEmailManualSent,
};
