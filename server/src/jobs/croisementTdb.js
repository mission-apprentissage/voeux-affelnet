const os = require("os");
const { getOvhFileAsStream } = require("../common/utils/ovhUtils");
const { oleoduc, writeData, compose, filterData } = require("oleoduc");
const { parseCsv } = require("../common/utils/csvUtils");
const { Voeu, Cfa } = require("../common/model");
const { intersection } = require("lodash");
const { optionalItem } = require("../common/utils/objectUtils");

const STATUT_MAPPER = {
  0: "abandons",
  1: "prospects",
  2: "inscrits",
  3: "apprentis",
};

async function getAffLycCandidats() {
  let res = await Voeu.aggregate([
    {
      $group: {
        _id: "$apprenant.ine",
      },
    },
  ]);

  return res.map((a) => a._id);
}

async function getAffLycFormations() {
  let res = await Voeu.aggregate([
    {
      $group: {
        _id: "$formation.code_formation_diplome",
      },
    },
  ]);

  return res.map((a) => a._id);
}

async function readCsv() {
  let stream = await getOvhFileAsStream("export/croisementVoeuxAffelnet-19102021-11h04.csv", { storage: "mna-flux" });
  return compose(stream, parseCsv());
}

async function findUaiFromSiret(siret) {
  if (!siret || siret.length !== 14) {
    return null;
  }

  let found = await Cfa.findOne({ siret }, { uai: 1 });
  return found?.uai;
}

function buildStatutsStats() {
  let newStatutStats = () => {
    return {
      nbCandidatsRetrouvés: 0,
      total: 0,
    };
  };

  return Object.values(STATUT_MAPPER).reduce((acc, statutName) => {
    return {
      ...acc,
      [statutName]: newStatutStats(),
    };
  }, {});
}

function percentage(value) {
  return Number(Math.round(value + "e1") + "e-1") + "%";
}

async function croisementTdb() {
  let stream = await readCsv();
  let apprenants2021 = new Set();
  let cfas = new Set();
  let statuts = buildStatutsStats();
  let candidats = await getAffLycCandidats();
  let affLycFormations = await getAffLycFormations();
  let afflyc = {
    nbCfas: await Cfa.countDocuments(),
    nbVoeux: await Voeu.countDocuments(),
    nbCandidats: candidats.length,
  };

  await oleoduc(
    stream,
    filterData((data) => {
      let statutName = STATUT_MAPPER[data.statut_apprenant];
      return (
        data.ine_apprenant &&
        statuts[statutName] &&
        ((data.annee_formation === "1" && data["periode_formation.0"] === "2021") ||
          data.annee_scolaire?.startsWith("2021"))
      );
    }),
    writeData(async (data) => {
      let ine = data.ine_apprenant;
      let uai = data.uai_etablissement;
      let siret = data.siret_etablissement;
      let cfd = data.formation_cfd;
      let statutName = STATUT_MAPPER[data.statut_apprenant];

      if (affLycFormations.includes(cfd) && !apprenants2021.has(ine)) {
        cfas.add(uai);
        apprenants2021.add(ine);
        statuts[statutName]["total"]++;

        let nbVoeux = await Voeu.countDocuments({
          "apprenant.ine": ine,
          "etablissement_accueil.uai": { $in: [uai, ...optionalItem(await findUaiFromSiret(siret))] },
          "formation.code_formation_diplome": cfd,
        });
        if (nbVoeux) {
          statuts[statutName]["nbCandidatsRetrouvés"]++;
        }
      }
    }),
    { parallel: os.cpus().length }
  );

  let candidatsRetrouvés = intersection([...candidats], [...apprenants2021]);
  let nbCandidatsRetrouvés = candidatsRetrouvés.length;
  let nbApprenants2021 = apprenants2021.size;

  return {
    "Nombre de voeux": afflyc.nbVoeux,
    "Nombre de CFA dans Afflyc": afflyc.nbCfas,
    "Nombre de CFA dans le TdB": cfas.size,
    "Nombre de CFA communs": await Cfa.countDocuments({ uai: { $in: [...cfas] } }),
    "Nombre de candidats": afflyc.nbCandidats,
    "Nombre d'apprenants": nbApprenants2021,
    "Nombre de candidats devenus apprenants": nbCandidatsRetrouvés,
    "Pourcentage de candidats (AffLyc)": percentage((nbCandidatsRetrouvés * 100) / afflyc.nbCandidats),
    "Pourcentage de candidats (Tdb)": percentage((nbCandidatsRetrouvés * 100) / nbApprenants2021),
    statuts: Object.keys(statuts).reduce((acc, key) => {
      let stats = statuts[key];
      return {
        ...acc,
        [key]: {
          "Nombre de candidats devenus apprenants": stats.nbCandidatsRetrouvés,
          "Pourcentage de candidats (AffLyc)": percentage((stats.nbCandidatsRetrouvés * 100) / nbCandidatsRetrouvés),
          "Pourcentage de candidats (Tdb)": percentage((stats.nbCandidatsRetrouvés * 100) / nbApprenants2021),
        },
      };
    }, {}),
  };
}

module.exports = croisementTdb;
