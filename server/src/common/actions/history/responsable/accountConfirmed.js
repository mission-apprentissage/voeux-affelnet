const { ResponsableActions } = require("../../../constants/History");
const { Etablissement } = require("../../../model");

const saveAccountConfirmed = async ({ _id }, email) => {
  await Etablissement.updateOne(
    { _id },
    {
      $push: {
        histories: {
          action: ResponsableActions.ACCOUNT_CONFIRMED,
          variables: {
            email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveAccountConfirmed,
};
