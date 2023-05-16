const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveDelegationCancelledByResponsable = async ({ uai, email }, responsable) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.DELEGATION_CANCELLED_BY_RESPONSABLE,
          variables: {
            email,
            responsable: responsable.email,
          },
        },
      },
    }
  );
};

module.exports = {
  saveDelegationCancelledByResponsable,
};
