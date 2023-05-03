const { ResponsableActions } = require("../../../constants/History");
const { Gestionnaire } = require("../../../model");

const saveAccountEmailUpdatedByAdmin = async ({ siret, email }, old_email, admin) => {
  await Gestionnaire.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN,
          variables: {
            new_email: email,
            old_email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountEmailUpdatedByAdmin,
};
