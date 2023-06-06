const { Gestionnaire, /*Voeu,*/ Formateur, Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date } = require("../common/utils/csvUtils.js");
// const { sortDescending } = require("../common/utils/dateUtils.js");
// const { areTelechargementsTotal } = require("../common/utils/cfaUtils");
const { UserStatut } = require("../common/constants/UserStatut");

// const getLastDownloadDate = (data) => {
//   const relatedDowloads =
//     data.voeux_telechargements
//       ?.filter((vt) => vt.uai === data.etablissements?.uai)
//       .sort((a, b) => sortDescending(a.date, b.date)) ?? [];

//   return relatedDowloads[relatedDowloads.length - 1]?.date;
// };

async function download(output, options = {}) {
  const formateurs = new Map();
  // const gestionnaires = new Map();

  const getFormateur = async (uai) => {
    try {
      if (formateurs.get(uai)) {
        return formateurs.get(uai);
      } else {
        const formateur = await Formateur.findOne({ uai }).lean();
        formateurs.set(uai, formateur);
        return formateur;
      }
    } catch (e) {
      return null;
    }
  };

  const columns = options.columns || {};
  await oleoduc(
    Gestionnaire.aggregate([
      {
        $match: {
          type: "Gestionnaire",
          // ...(options.filter || {}),
          statut: { $ne: "non concerné" },
          ...(options.academies
            ? {
                $or: [
                  { "academie.code": { $in: options.academies } },
                  {
                    etablissements: {
                      $elemMatch: { "academie.code": { $in: options.academies } },
                    },
                  },
                ],
              }
            : {}),
        },
      },
      ...(options.academies
        ? [
            {
              $addFields: {
                etablissements: {
                  $filter: {
                    input: "$etablissements",
                    as: "etablissement",
                    cond: { $in: ["$$etablissement.academie.code", options.academies] },
                  },
                },
              },
            },
          ]
        : []),

      {
        $unwind: {
          path: "$etablissements",
          preserveNullAndEmptyArrays: false,
        },
      },

      { $sort: { "academie.code": 1, siret: 1 } },
    ]).cursor(),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        "Académie de l’organisme responsable": (data) => data.academie?.nom,
        "Siret de l’organisme responsable": (data) => data.siret,
        "Uai de l'établissement responsable": (data) => data.uai,
        "Url du responsable": (data) => `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/gestionnaire/${data.siret}`,
        "Raison sociale de l’organisme responsable": (data) => data.raison_sociale,
        "Email de contact de l’organisme responsable": (data) => data.email,
        "Académie de l’organisme formateur": (data) => data.etablissements?.academie?.nom,
        "Siret de l'établissement formateur": async (data) => (await getFormateur(data.etablissements?.uai))?.siret,
        "Uai de l'établissement formateur": (data) => data.etablissements?.uai,
        "Url du formateur": (data) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/gestionnaire/${data.siret}/formateur/${data.etablissements?.uai}`,
        "Raison sociale de l’établissement formateur": async (data) =>
          (
            await getFormateur(data.etablissements?.uai)
          )?.raison_sociale,
        // "Type de l'établissement d'accueil": async (data) => {
        //   const ufa = await Formateur.findOne({ uai: data.etablissements?.uai });

        //   return ufa?.libelle_type_etablissement ?? "";
        // },
        "Délégation autorisée": (data) => ouiNon(data.etablissements.diffusionAutorisee),
        "Email de contact de l'organisme formateur": async (data) =>
          (await getFormateur(data.etablissements?.uai))?.email ?? data.etablissements.email,
        "Statut ": async (data) => {
          const gestionnaire = data;
          const formateur = await getFormateur(data.etablissements?.uai);

          const voeuxTelechargementsFormateur = formateur.voeux_telechargements?.filter(
            (telechargement) => telechargement.siret === gestionnaire.siret
          );

          const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements?.filter(
            (telechargement) => telechargement.uai === formateur.uai
          );

          const voeuxDisponible = data.etablissements.nombre_voeux > 0;

          switch (data.etablissements.diffusionAutorisee) {
            case true: {
              switch (true) {
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  new Date(data.etablissements.first_date_voeux).getTime() !==
                    new Date(data.etablissements.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() > new Date(data.etablissements.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  new Date(data.etablissements.first_date_voeux).getTime() !==
                    new Date(data.etablissements.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(data.etablissements.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() > new Date(data.etablissements.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  new Date(data.etablissements.first_date_voeux).getTime() ===
                    new Date(data.etablissements.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() > new Date(data.etablissements.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsFormateur.length ||
                    !voeuxTelechargementsFormateur.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(data.etablissements.last_date_voeux).getTime()
                    )): {
                  return "⚠️ Compte créé, liste non téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut && !voeuxDisponible: {
                  return "✅ Compte créé";
                }
                case UserStatut.CONFIRME === formateur.statut: {
                  return "⚠️ Délégation activée, compte non créé";
                }
                case !!formateur.emails.length && UserStatut.EN_ATTENTE === formateur.statut: {
                  return "⚠️ En attente de confirmation d'email";
                }
                case !formateur.emails.length && UserStatut.EN_ATTENTE === formateur.statut: {
                  return "✅ En attente de diffusion de campagne";
                }
                default: {
                  return "⚠️ Etat inconnu";
                }
              }
            }
            case false: {
              switch (true) {
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  new Date(data.etablissements.first_date_voeux).getTime() !==
                    new Date(data.etablissements.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsGestionnaire.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() > new Date(data.etablissements.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  new Date(data.etablissements.first_date_voeux).getTime() !==
                    new Date(data.etablissements.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsGestionnaire.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(data.etablissements.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() > new Date(data.etablissements.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  new Date(data.etablissements.first_date_voeux).getTime() ===
                    new Date(data.etablissements.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsGestionnaire.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() > new Date(data.etablissements.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsGestionnaire.length ||
                    !voeuxTelechargementsGestionnaire.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(data.etablissements.last_date_voeux).getTime()
                    )): {
                  return "⚠️ Compte créé, liste non téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut && !voeuxDisponible: {
                  return "✅ Compte créé";
                }
                case UserStatut.CONFIRME === gestionnaire.statut: {
                  return "⚠️ Email confirmé, compte non créé";
                }
                case !!gestionnaire.emails.length && UserStatut.EN_ATTENTE === gestionnaire.statut: {
                  return "⚠️ En attente de confirmation d'email";
                }
                case !gestionnaire.emails.length && UserStatut.EN_ATTENTE === gestionnaire.statut: {
                  return "✅ En attente de diffusion de campagne";
                }

                default: {
                  return "⚠️ Etat inconnu";
                }
              }
            }
            default: {
              return "⚠️ Etat inconnu";
            }
          }
        },
        "Dernière action [libellé technique]": async (data) => {
          const formateur = await getFormateur(data.etablissements.uai);
          return formateur.histories?.[formateur.histories.length - 1]?.action;
        },
        Vœux: (data) => ouiNon(data.etablissements?.voeux_date),
        "Nombre de vœux": async (data) =>
          `${await Voeu.countDocuments({
            "etablissement_formateur.uai": data.etablissements?.uai,
            "etablissement_gestionnaire.siret": data.siret,
          })}`,
        "Date du dernier import de vœux": (data) => date(data.etablissements?.voeux_date),
        // Téléchargement: (data) => {
        //   const lastDownloadDate = getLastDownloadDate(data);

        //   return ouiNon(!!lastDownloadDate);
        // },
        // "Téléchargement effectué pour tous les établissements formateurs liés ?": async (data) => {
        //   try {
        //     if (gestionnaires.get(data.siret)) {
        //       return ouiNon(areTelechargementsTotal(gestionnaires.get(data.siret), data.voeux_telechargements));
        //     } else {
        //       const gestionnaire = await Gestionnaire.findOne({ siret: data.siret }).lean();
        //       gestionnaires.set(data.siret, gestionnaire);
        //       return ouiNon(areTelechargementsTotal(gestionnaire.etablissements, data.voeux_telechargements));
        //     }
        //   } catch (e) {
        //     return null;
        //   }
        // },
        // "Date du dernier téléchargement": (data) => {
        //   const lastDownloadDate = getLastDownloadDate(data);

        //   return date(lastDownloadDate);
        // },
        // "Nombre de vœux téléchargés au moins une fois": async (data) => {
        //   const lastDownloadDate = getLastDownloadDate(data);

        //   return `${
        //     lastDownloadDate
        //       ? await Voeu.countDocuments({
        //           "etablissement_formateur.uai": data.etablissements?.uai,
        //           "etablissement_gestionnaire.siret": data.siret,
        //           $expr: {
        //             $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
        //           },
        //         })
        //       : 0
        //   }`;
        // },
        // "Nombre de vœux jamais téléchargés": async (data) => {
        //   const lastDownloadDate = getLastDownloadDate(data);

        //   return `${
        //     lastDownloadDate
        //       ? await Voeu.countDocuments({
        //           "etablissement_formateur.uai": data.etablissements?.uai,
        //           "etablissement_gestionnaire.siret": data.siret,
        //           $nor: [
        //             {
        //               $expr: {
        //                 $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
        //               },
        //             },
        //           ],
        //         })
        //       : await Voeu.countDocuments({
        //           "etablissement_formateur.uai": data.etablissements?.uai,
        //           "etablissement_gestionnaire.siret": data.siret,
        //         })
        //   }`;
        // },
        // "Nombre de vœux à télécharger (nouveau+maj)": async (data) => {
        //   const lastDownloadDate = getLastDownloadDate(data);

        //   return `${
        //     lastDownloadDate
        //       ? await Voeu.countDocuments({
        //           "etablissement_formateur.uai": data.etablissements?.uai,
        //           $expr: {
        //             $lte: [lastDownloadDate, { $last: "$_meta.import_dates" }],
        //           },
        //         })
        //       : await Voeu.countDocuments({
        //           "etablissement_gestionnaire.siret": data.siret,
        //         })
        //   }`;
        // },
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { download };
