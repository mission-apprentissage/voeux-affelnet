const { Dossier } = require("../model/index.js");
const { removeDiacritics } = require("../utils/objectUtils.js");

function getGestionnaires() {
  return {
    "0601162M": "0597090L",
    "0595846J": "0595846J",
    "0602183X": "0602183X",
    "0602182W": "0602182W",
    "0590189K": "0596792M",
    "0590187H": "0596792M",
    "0597058B": "0596792M",
    "0620011A": "0624250H",
    "0622099V": "0596792M",
    "0623105N": "0623105N",
    "0620131F": "0596792M",
    "0620018H": "0596792M",
    "0622807P": "0623465E",
    "0620192X": "0596792M",
    "0622801H": "0624092L",
    "0133535X": "0601613C",
    "0400786M": "0601613C",
    "0942024P": "0601613C",
    "0501793C": "0601613C",
    "0601575L": "0595689N",
    "0711439D": "0595689N",
    "0595124Z": "0595689N",
    "0593257V": "0595689N",
    "0596322B": "0595689N",
    "0595689N": "0595689N",
    "0595119U": "0595689N",
    "0595121W": "0595121W",
    "0623276Z": "0595689N",
    "0623280D": "0595689N",
    "0624473A": "0593321P",
    "0021502X": "0596997K",
    "0595821G": "0596997K",
    "0624373S": "0596997K",
    "0624100V": "0596997K",
    "0623631K": "0596997K",
    "0623801V": "0596997K",
    "0595778K": "0595778K",
    "0596791L": "0596791L",
    "0597237W": "0597237W",
    "0021740F": "0601500E",
    "0021796S": "0601500E",
    "0601484M": "0601500E",
    "0596406T": "0596406T",
    "0022041H": "0022041H",
    "0801999N": "0801999N",
    "0801997L": "0801997L",
    "0596318X": "0602089V",
    "0596316V": "0596316V",
    "0596328H": "0596328H",
    "0596315U": "0602089V",
    "0624184L": "0602089V",
    "0624499D": "0624499D",
    "0772824B": "0772824B",
    "0624476D": "0596792M",
    "0881690J": "0881690J",
    "0022046N": "0021522U",
    "0624176C": "0624176C",
    "0601997V": "0601997V",
    "0451694X": "0451246K",
    "0410036S": "0451708M",
    "0371211R": "0451708M",
    "0180571Y": "0180571Y",
    "0371711J": "0371409F",
    "0410854F": "0280944Z",
    "0410855G": "0280944Z",
    "0360686A": "0280944Z",
    "0280946B": "0280944Z",
    "0280947C": "0280944Z",
    "0280942X": "0280944Z",
    "0180758B": "0280944Z",
    "0411045N": "0410018X",
    "0180847Y": "0180847Y",
    "0410955R": "0410018X",
    "0281100U": "0280944Z",
    "0371800F": "0371800F",
  };
}

function findDossier(voeu) {
  const gestionnaires = getGestionnaires();
  const uai = voeu.etablissement_accueil.uai;
  const responsable = voeu.responsable;
  const uais = gestionnaires[uai] ? [uai, gestionnaires[uai]] : [uai];

  return Dossier.findOne({
    uai_etablissement: { $in: uais },
    formation_cfd: voeu.formation.code_formation_diplome,
    annee_formation: 1,
    $or: [
      { ine_apprenant: voeu.apprenant.ine },
      {
        "_meta.nom_complet": removeDiacritics(`${voeu.apprenant.prenom} ${voeu.apprenant.nom}`),
      },
      ...(responsable?.email_1 ? [{ email_contact: responsable.email_1 }] : []),
      ...(responsable?.email_2 ? [{ email_contact: responsable.email_2 }] : []),
    ],
  });
}

module.exports = { findDossier };
