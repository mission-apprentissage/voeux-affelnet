// TODO :

const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveListAvailableEmailAutomaticSent = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
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
