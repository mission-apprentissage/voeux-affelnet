const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveDelegationCancelledByAdmin = async ({ uai, email }, admin) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.DELEGATION_CANCELLED_BY_ADMIN,
          variables: {
            email,
            admin: admin.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationCancelledByAdmin,
};
