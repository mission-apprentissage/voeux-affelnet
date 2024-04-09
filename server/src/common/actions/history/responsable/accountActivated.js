const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveAccountActivated = async ({ siret, email }) => {
  await Responsable.updateOne(
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
