const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountActivated = async ({ uai, email }) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_ACTIVATED,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountActivated,
};
