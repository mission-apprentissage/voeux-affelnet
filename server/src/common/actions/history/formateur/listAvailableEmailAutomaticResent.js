// TODO :

const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveListAvailableEmailAutomaticResent = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
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
