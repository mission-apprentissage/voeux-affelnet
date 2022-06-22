const { Voeu, Dossier } = require("../model/index.js");
const { compose, transformData, transformIntoCSV } = require("oleoduc");
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

function besoinAide(statut) {
  return !["apprenti", "inscrit"].includes(statut);
}

function getWidgetLBAUrl(statut, voeu) {
  const cle = voeu.formation.cle_ministere_educatif?.replace(/#/g, "%23");
  if (!cle || !besoinAide(statut)) {
    return "";
  }

  return `https://labonnealternance.pole-emploi.fr/recherche-apprentissage?&display=list&page=fiche&type=training&itemId=${cle}`;
}

function getDidaskModules(statut) {
  if (!besoinAide(statut)) {
    return {
      "Didask - Prendre contact avec un CFA": "",
      "Didask - Chercher un employeur": "",
      "Didask - Préparer un entretien avec un employeur": "",
      "Didask - S'intégrer dans l'entreprise": "",
    };
  }

  const baseUrl = `https://dinum-beta.didask.com/courses/demonstration`;
  return {
    "Didask - Prendre contact avec un CFA": `${baseUrl}/60abc18c075edf000065c987`,
    "Didask - Chercher un employeur": `${baseUrl}/60d21bf5be76560000ae916e`,
    "Didask - Préparer un entretien avec un employeur": `${baseUrl}/60d1adbb877dae00003f0eac`,
    "Didask - S'intégrer dans l'entreprise": `${baseUrl}/6283bd5ad9c7ae00003ede91`,
  };
}

function getTrajectoiresPro(statut, voeu) {
  if (!besoinAide(statut)) {
    return "";
  }

  const uai = voeu.etablissement_accueil.uai;
  const cfd = voeu.formation.code_formation_diplome;
  return `https://trajectoires-pro.apprentissage.beta.gouv.fr/api/inserjeunes/formations/${uai}-${cfd}.svg`;
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

function buildAdresseLibelle(adresse) {
  return `${adresse.ligne_1} ${adresse.ligne_2} ${adresse.ligne_3} ${adresse.ligne_4} ${adresse.code_postal} ${adresse.ville} ${adresse.pays}`
    .replace(/undefined/g, "")
    .replace(/\s\s+/g, " ")
    .trim();
}

async function getVoeuxCroisementCsvStream(options = {}) {
  const academies = options.academies;

  return compose(
    Voeu.find(academies ? { "academie.code": { $in: academies } } : {})
      .lean()
      .cursor(),
    transformData(
      async (voeu) => {
        const dossier = await findDossier(voeu);
        const statut = dossier?.statut || "Non trouvé";

        return {
          "Apprenant INE": voeu.apprenant.ine,
          "Apprenant Nom": voeu.apprenant.nom,
          "Apprenant prénom": voeu.apprenant.prenom,
          "Apprenant Téléphone Personnel": voeu.apprenant.telephone_personnel,
          "Apprenant Téléphone Portable": voeu.apprenant.telephone_portable,
          "Apprenant Adresse": buildAdresseLibelle(voeu.apprenant.adresse),
          "Etablissement Accueil UAI": voeu.etablissement_accueil.uai,
          "Etablissement Accueil Nom": voeu.etablissement_accueil.nom,
          "Formation CFD": voeu.formation.code_formation_diplome,
          "Formation MEF": voeu.formation.mef,
          "Formation Libellé": voeu.formation.libelle,
          Académie: voeu.academie.nom,
          "Statut dans le tableau de bord": statut,
          "La Bonne Alternance": getWidgetLBAUrl(statut, voeu),
          InserJeunes: getTrajectoiresPro(statut, voeu),
          ...getDidaskModules(statut),
        };
      },
      { parallel: 10 }
    ),
    transformIntoCSV()
  );
}
module.exports = { getVoeuxCroisementCsvStream };
