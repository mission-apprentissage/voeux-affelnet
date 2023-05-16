const { ResponsableActions } = require("../../../constants/History");
const { Gestionnaire } = require("../../../model");

const saveAccountEmailUpdatedByAccount = async ({ siret, email }, old_email) => {
  await Gestionnaire.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT,
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
