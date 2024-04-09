const { FormateurActions } = require("../../../constants/History");
const { Formateur, Responsable } = require("../../../model");

const saveUpdatedListDownloadedByFormateur = async ({ uai, siret }) => {
  const formateur = await Formateur.findOne({ uai }).select({ _id: 0, histories: 0 }).lean();
  const responsable = await Responsable.findOne({ siret }).select({ _id: 0, histories: 0 }).lean();

  await Formateur.updateOne(
    { uai: formateur.uai },
    {
      $push: {
        histories: {
          action: FormateurActions.UPDATED_LIST_DOWNLOADED_BY_FORMATEUR,
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
  saveUpdatedListDownloadedByFormateur,
};
