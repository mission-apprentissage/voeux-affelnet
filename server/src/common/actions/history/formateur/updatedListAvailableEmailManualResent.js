// TODO :

const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveUpdatedListAvailableEmailManualResent = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
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
