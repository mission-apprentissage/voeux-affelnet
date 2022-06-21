const { oleoduc, transformData, writeData, transformIntoCSV } = require("oleoduc");
const { Voeu, Dossier } = require("../common/model/index.js");
const { parseCsv } = require("../common/utils/csvUtils.js");
const { removeDiacritics } = require("../common/utils/objectUtils.js");
const { getAcademies } = require("../common/academies.js");
const { intersectionBy } = require("lodash");

async function loadMapping(csvStream) {
  const mapping = {};
  await oleoduc(
    csvStream,
    parseCsv(),
    writeData((data) => {
      if (data.uai && data.uai_gestionnaire) {
        mapping[data.uai] = data.uai_gestionnaire;
      }
    })
  );
  return mapping;
}

function buildStats() {
  return getAcademies().reduce(async (acc, a) => {
    const [stats, nbVoeux, uaisVoeux, uaisTdb] = await Promise.all([
      acc,
      Voeu.countDocuments({ "academie.code": a.code }),
      Voeu.aggregate([{ $match: { "academie.code": a.code } }, { $group: { _id: "$etablissement_accueil.uai" } }]),
      Dossier.aggregate([{ $match: { "academie.code": a.code } }, { $group: { _id: "$uai_etablissement" } }]),
    ]);

    stats.push({
      nom: a.nom,
      voeux: {
        "Nombre de voeux pour cette académie": nbVoeux,
        "Dossiers trouvés dans le tdb": 0,
      },
      uais: {
        "Nombre d'établissements d'accueil pour cette académie": uaisVoeux.length,
        "Etablissements trouvés dans le tdb": intersectionBy(uaisVoeux, uaisTdb, (v) => v._id).length,
      },
    });
    return stats;
  }, Promise.resolve([]));
}

function getWidgetLBAUrl(formation) {
  const cle = formation.cle_ministere_educatif?.replace(/#/g, "%23");
  if (!cle) {
    return "";
  }

  return `https://labonnealternance.pole-emploi.fr/recherche-apprentissage?&display=list&page=fiche&type=training&itemId=${cle}`;
}

function getDidaskModules() {
  const baseUrl = `https://dinum-beta.didask.com/courses/demonstration`;
  return {
    "Didask - Prendre contact avec un CFA": `${baseUrl}/60abc18c075edf000065c987`,
    "Didask - Chercher un employeur": `${baseUrl}/60d21bf5be76560000ae916e`,
    "Didask - Préparer un entretien avec un employeur": `${baseUrl}/60d1adbb877dae00003f0eac`,
    "Didask - S'intégrer dans l'entreprise": `${baseUrl}/6283bd5ad9c7ae00003ede91`,
  };
}

function findDossier(voeu, uaiMapping) {
  const uai = voeu.etablissement_accueil.uai;
  const responsable = voeu.responsable;
  const uais = uaiMapping[uai] ? [uai, uaiMapping[uai]] : [uai];

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

async function exportCroisement(output, options = {}) {
  const uaiMapping = options.mapping ? await loadMapping(options.mapping) : {};
  const stats = await buildStats(uaiMapping);

  await oleoduc(
    Voeu.find().lean().cursor(),
    transformData(
      async (voeu) => {
        const uai = voeu.etablissement_accueil.uai;
        const formation = voeu.formation;
        const ine = voeu.apprenant.ine;
        const academie = voeu.academie.nom;

        const dossier = await findDossier(voeu, uaiMapping);

        if (dossier) {
          stats.find((s) => s.nom === academie).voeux["Dossiers trouvés dans le tdb"]++;
        }

        const statut = dossier?.statut || "Non trouvé";
        const generateLinks = !["apprenti", "inscrit"].includes(statut);

        return {
          INE: ine,
          UAI: uai,
          CFD: formation.code_formation_diplome,
          Académie: academie,
          "Statut dans le tableau de bord": statut,
          ...(generateLinks
            ? {
                "La Bonne Alternance": getWidgetLBAUrl(formation),
                ...getDidaskModules(),
              }
            : {}),
        };
      },
      { parallel: 10 }
    ),
    transformIntoCSV(),
    output
  );

  return stats;
}
module.exports = exportCroisement;
