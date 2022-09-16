const { Voeu, Cfa } = require("../model/index.js");
const { compose, transformData } = require("oleoduc");
const { dateAsString, capitalizeFirstLetter } = require("../utils/stringUtils.js");
const { sortDescending } = require("../utils/dateUtils.js");
const { ouiNon } = require("../utils/csvUtils.js");
const { findRegionByName } = require("../regions.js");
const { findDossiers } = require("./findDossiers.js");

async function findDossier(voeu) {
  const results = await findDossiers(voeu.apprenant, voeu.responsable, [
    {
      uai_etablissement: voeu.etablissement_accueil.uai,
      formation_cfd: voeu.formation.code_formation_diplome,
    },
  ]);

  return results[0] || null;
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

function getJeuneStatut(voeu) {
  const academies = findRegionByName("Centre-Val de Loire").academies;
  return academies.find((a) => a.code === voeu.academie.code)
    ? ouiNon(voeu._meta.jeune_uniquement_en_apprentissage)
    : "ND";
}

function getTrajectoiresProUrl(statut, voeu) {
  if (!besoinAide(statut)) {
    return "";
  }

  const uai = voeu.etablissement_accueil.uai;
  const cfd = voeu.formation.code_formation_diplome;
  return `https://trajectoires-pro.apprentissage.beta.gouv.fr/api/inserjeunes/formations/${uai}-${cfd}.svg`;
}

async function streamCroisementVoeux(options = {}) {
  const academies = options.academies;

  return compose(
    Voeu.find(academies ? { "academie.code": { $in: academies.map((a) => a.code) } } : {})
      .lean()
      .cursor(),
    transformData(
      async (voeu) => {
        const uai = voeu.etablissement_accueil.uai;
        const [dossier, cfa] = await Promise.all([
          findDossier(voeu),
          Cfa.findOne({ "voeux_telechargements.uai": uai }),
        ]);

        const statut = dossier?.statut;
        const downloadDate = cfa?.voeux_telechargements
          .sort((a, b) => sortDescending(a.date, b.date))
          .find((t) => t.uai === uai)?.date;

        return {
          "Apprenant INE": voeu.apprenant.ine,
          "Apprenant Nom": voeu.apprenant.nom,
          "Apprenant prénom": voeu.apprenant.prenom,
          "Apprenant Téléphone Personnel": voeu.apprenant.telephone_personnel,
          "Apprenant Téléphone Portable": voeu.apprenant.telephone_portable,
          "Apprenant Adresse": voeu.apprenant.adresse.libelle,
          "Apprenant Adresse Code Postal": voeu.apprenant.adresse.code_postal,
          "Apprenant Adresse Ville": voeu.apprenant.adresse.ville,
          "Apprenant Adresse Pays": voeu.apprenant.adresse.pays,
          "Etablissement Origine UAI": voeu.etablissement_origine?.uai,
          "Etablissement Origine Nom": voeu.etablissement_origine?.nom,
          "Etablissement Origine CIO": voeu.etablissement_origine?.cio,
          "Etablissement Accueil UAI": uai,
          "Etablissement Accueil Nom": voeu.etablissement_accueil.nom,
          "Etablissement Accueil CIO": voeu.etablissement_accueil.cio,
          "Formation CFD": voeu.formation.code_formation_diplome,
          "Formation MEF": voeu.formation.mef,
          "Formation Libellé": voeu.formation.libelle,
          Académie: voeu.academie.nom,
          "Statut dans le tableau de bord": statut ? capitalizeFirstLetter(statut) : "Non trouvé",
          "Date de téléchargement du voeu par l'OF": downloadDate ? dateAsString(downloadDate) : "",
          "La Bonne Alternance": getWidgetLBAUrl(statut, voeu),
          InserJeunes: getTrajectoiresProUrl(statut, voeu),
          ...getDidaskModules(statut),
          "Jeunes uniquement en apprentissage": getJeuneStatut(voeu),
        };
      },
      { parallel: 10 }
    )
  );
}
module.exports = { streamCroisementVoeux };
