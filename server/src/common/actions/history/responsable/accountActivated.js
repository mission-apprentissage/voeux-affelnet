const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountActivated = async ({ uai, email }) => {
  await Etablissement.updateOne(
    { uai },
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
