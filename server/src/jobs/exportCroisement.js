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

async function exportCroisement(output, options = {}) {
  const uaiMapping = options.mapping ? await loadMapping(options.mapping) : {};
  const stats = await buildStats(uaiMapping);

  await oleoduc(
    Voeu.find().lean().cursor(),
    transformData(
      async (voeu) => {
        const responsable = voeu.responsable;
        const uai = voeu.etablissement_accueil.uai;
        const cfd = voeu.formation.code_formation_diplome;
        const ine = voeu.apprenant.ine;
        const academie = voeu.academie.nom;
        const uais = uaiMapping[uai] ? [uai, uaiMapping[uai]] : [uai];

        const dossier = await Dossier.findOne({
          uai_etablissement: { $in: uais },
          formation_cfd: cfd,
          annee_formation: 1,
          $or: [
            { ine_apprenant: ine },
            {
              "_meta.nom_complet": removeDiacritics(`${voeu.apprenant.prenom} ${voeu.apprenant.nom}`),
            },
            ...(responsable?.email_1 ? [{ email_contact: responsable.email_1 }] : []),
            ...(responsable?.email_2 ? [{ email_contact: responsable.email_2 }] : []),
          ],
        });

        if (dossier) {
          stats.find((s) => s.nom === academie).voeux["Dossiers trouvés dans le tdb"]++;
        }

        return {
          INE: ine,
          UAI: uai,
          CFD: cfd,
          academie: academie,
          "Statut dans le tableau de bord": dossier?.statut || "absent",
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
