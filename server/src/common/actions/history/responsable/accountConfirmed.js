const { ResponsableActions } = require("../../../constants/History");
const { Responsable } = require("../../../model");

const saveAccountConfirmed = async ({ _id }, email) => {
  await Responsable.updateOne(
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
