const { FormateurActions } = require("../../../constants/History");
const { Formateur, Gestionnaire } = require("../../../model");

const saveUpdatedListDownloadedByResponsable = async ({ uai, siret }) => {
  const formateur = await Formateur.findOne({ uai }).select({ _id: 0, histories: 0 }).lean();
  const responsable = await Gestionnaire.findOne({ siret }).select({ _id: 0, histories: 0 }).lean();

  await Formateur.updateOne(
    { uai: formateur.uai },
    {
      $push: {
        histories: {
          action: FormateurActions.UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE,
          variables: {
            formateur,
            responsable,
          },
        },
      },
    }
  );
};

module.exports = {
  saveUpdatedListDownloadedByResponsable,
};
