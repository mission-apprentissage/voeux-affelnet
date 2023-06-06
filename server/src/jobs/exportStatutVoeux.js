const { Gestionnaire, Voeu, Formateur } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date } = require("../common/utils/csvUtils.js");
const { sortDescending } = require("../common/utils/dateUtils.js");
const { areTelechargementsTotal } = require("../common/utils/dataUtils");
const CatalogueApi = require("../common/api/CatalogueApi");

const getLastDownloadDate = (data) => {
  const relatedDowloads = data.voeux_telechargements
    ?.filter((vt) => vt.uai === data.etablissements.uai)
    .sort((a, b) => sortDescending(a.date, b.date));

  return relatedDowloads[relatedDowloads.length - 1]?.date;
};

async function exportStatutVoeux(output, options = {}) {
  const catalogueApi = new CatalogueApi();

  const etablissements = new Map();
  const columns = options.columns || {};
  await oleoduc(
    Gestionnaire.aggregate([
      {
        $match: {
          ...(options.filter || {}),
          statut: { $ne: "non concerné" },
        },
      },
      { $unwind: "$etablissements" },
      { $sort: { "academie.code": 1, siret: 1 } },
    ]).cursor(),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        Académie: (data) => data.academie?.nom,
        "Siret de l’organisme responsable": (data) => data.siret,
        "Raison sociale de l’organisme responsable": (data) => data.raison_sociale,
        "Email de contact de l’organisme responsable": (data) => data.email,
        Uai: (data) => data.etablissements?.uai,
        "Raison sociale de l’établissement d’accueil": async (data) => {
          try {
            if (etablissements.get(data.etablissements?.uai)) {
              return etablissements.get(data.etablissements?.uai);
            } else {
              const etablissement = await catalogueApi.getEtablissement({ uai: data.etablissements?.uai });
              etablissements.set(data.etablissements?.uai, etablissement.entreprise_raison_sociale);
              return etablissement.entreprise_raison_sociale;
            }
          } catch (e) {
            return null;
          }
        },
        "Type de l'établissement d'accueil": async (data) => {
          const ufa = await Formateur.findOne({ uai: data.etablissements.uai });

          return ufa?.libelle_type_etablissement ?? "";
        },
        "Statut ": (data) =>
          data.statut === "activé" ? "contact responsable confirmé" : "contact responsable non confirmé",
        Vœux: (data) => ouiNon(data.etablissements?.voeux_date),
        "Nombre de vœux": async (data) =>
          `${await Voeu.countDocuments({
            "etablissement_accueil.uai": data.etablissements.uai,
          })}`,
        "Date du dernier import de vœux": (data) => date(data.etablissements?.voeux_date),
        Téléchargement: (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return ouiNon(!!lastDownloadDate);
        },
        "Téléchargement effectué pour tous les établissements d’accueil liés ?": async (data) => {
          const cfa = await Gestionnaire.find({ _id: data._id });
          return ouiNon(areTelechargementsTotal(cfa.etablissements, data.voeux_telechargements));
        },
        "Date du dernier téléchargement": (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return date(lastDownloadDate);
        },
        "Nombre de vœux téléchargés au moins une fois": async (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return `${
            lastDownloadDate
              ? await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                  $expr: {
                    $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
                  },
                })
              : 0
          }`;
        },
        "Nombre de vœux jamais téléchargés": async (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return `${
            lastDownloadDate
              ? await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                  $nor: [
                    {
                      $expr: {
                        $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
                      },
                    },
                  ],
                })
              : await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                })
          }`;
        },
        "Nombre de vœux à télécharger (nouveau+maj)": async (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return `${
            lastDownloadDate
              ? await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                  $expr: {
                    $lte: [lastDownloadDate, { $last: "$_meta.import_dates" }],
                  },
                })
              : await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                })
          }`;
        },
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { exportStatutVoeux };
