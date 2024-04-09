const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticSent = async ({ siret, email }) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListAvailableEmailAutomaticSent,
};
