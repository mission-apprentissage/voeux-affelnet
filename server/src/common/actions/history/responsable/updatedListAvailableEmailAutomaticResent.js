const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticResent = async ({ siret, email }) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailableEmailAutomaticResent,
};
