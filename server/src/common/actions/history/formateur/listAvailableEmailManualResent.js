const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveListAvailableEmailManualResent = async ({ uai, email }, admin) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
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
  saveListAvailableEmailManualResent,
};
