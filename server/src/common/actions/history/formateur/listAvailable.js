const { FormateurActions } = require("../../../constants/History");
const { Formateur, Gestionnaire } = require("../../../model");

const saveListAvailable = async ({ uai, siret, nombre_voeux }) => {
  const formateur = await Formateur.findOne({ uai }).select({ _id: 0, histories: 0 }).lean();
  const responsable = await Gestionnaire.findOne({ siret }).select({ _id: 0, histories: 0 }).lean();

  await Formateur.updateOne(
    { uai },
    {
      $push: {
        histories: {
          action: FormateurActions.LIST_AVAILABLE,
          variables: {
            nombre_voeux,
            formateur,
            responsable,
          },
        },
      },
    }
  );
};

module.exports = {
  saveListAvailable,
};
