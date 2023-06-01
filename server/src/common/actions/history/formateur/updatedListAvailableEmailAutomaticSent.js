const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveUpdatedListAvailableEmailAutomaticSent = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
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
