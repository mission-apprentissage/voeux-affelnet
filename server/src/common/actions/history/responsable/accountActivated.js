const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountActivated = async ({ siret, email }) => {
  await Etablissement.updateOne(
    { siret },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_ACTIVATED,
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
