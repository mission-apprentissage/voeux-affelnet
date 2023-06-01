const { ResponsableActions } = require("../../../constants/History");
const { Gestionnaire } = require("../../../model");

const saveUpdatedListAvailableEmailManualResent = async ({ siret, email }, admin) => {
  await Gestionnaire.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
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
  saveUpdatedListAvailableEmailManualResent,
};
