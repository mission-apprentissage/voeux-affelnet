const { FormateurActions } = require("../../../constants/History");
const { Formateur } = require("../../../model");

const saveDelegationCreatedByResponsable = async ({ uai, email }, responsable) => {
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.DELEGATION_CREATED_BY_RESPONSABLE,
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
  saveDelegationCreatedByResponsable,
};
