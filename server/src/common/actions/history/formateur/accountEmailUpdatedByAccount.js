const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveAccountEmailUpdatedByAccount = async ({ uai, email }, old_email) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT,
          variables: {
            new_email: email,
            old_email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountEmailUpdatedByAccount,
};
