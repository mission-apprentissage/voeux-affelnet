const { Gestionnaire, /*Voeu,*/ Formateur, Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV, transformData } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date } = require("../common/utils/csvUtils.js");
// const { sortDescending } = require("../common/utils/dateUtils.js");
// const { areTelechargementsTotal } = require("../common/utils/cfaUtils");
const { UserStatut } = require("../common/constants/UserStatut");
const { fillFormateur, fillGestionnaire } = require("../common/utils/dataUtils");

// const getLastDownloadDate = ({gestionnaire}) => {
//   const relatedDowloads =
//     data.voeux_telechargements
//       ?.filter((vt) => vt.uai === etablissementFromGestionnaire?.uai)
//       .sort((a, b) => sortDescending(a.date, b.date)) ?? [];

//   return relatedDowloads[relatedDowloads.length - 1]?.date;
// };

async function download(output, options = {}) {
  const formateurs = new Map();
  const gestionnaires = new Map();

  const getFormateur = async (uai, admin) => {
    try {
      if (formateurs.get(uai)) {
        return formateurs.get(uai);
      } else {
        const formateur = await fillFormateur(await Formateur.findOne({ uai }).lean(), admin);
        formateurs.set(uai, formateur);
        return formateur;
      }
    } catch (e) {
      return null;
    }
  };

  const getGestionnaire = async (siret, admin) => {
    try {
      if (gestionnaires.get(siret)) {
        return gestionnaires.get(siret);
      } else {
        const gestionnaire = await fillGestionnaire(await Gestionnaire.findOne({ siret }).lean(), admin);
        gestionnaires.set(siret, gestionnaire);
        return gestionnaire;
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
    transformData(async (data) => {
      const formateur = await getFormateur(data.etablissements?.uai, options?.admin);
      const gestionnaire = await getGestionnaire(data.siret, options?.admin);

      return {
        gestionnaire,
        formateur,
      };
    }),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        "Académie de l’organisme responsable": ({ gestionnaire }) => gestionnaire.academie?.nom,
        "Siret de l’organisme responsable": ({ gestionnaire }) => gestionnaire.siret,
        "Uai de l'établissement responsable": ({ gestionnaire }) => gestionnaire.uai,
        "Url du responsable": ({ gestionnaire }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/gestionnaire/${gestionnaire.siret}`,
        "Raison sociale de l’organisme responsable": ({ gestionnaire }) => gestionnaire.raison_sociale,
        "Email de contact de l’organisme responsable": ({ gestionnaire }) => gestionnaire.email,
        "Académie de l’organisme formateur": ({ formateur }) => formateur?.academie?.nom,
        "Siret de l'établissement formateur": ({ formateur }) => formateur?.siret,
        "Uai de l'établissement formateur": ({ formateur }) => formateur?.uai,
        "Url du formateur": ({ gestionnaire, formateur }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/gestionnaire/${gestionnaire.siret}/formateur/${formateur?.uai}`,
        "Raison sociale de l’établissement formateur": ({ formateur }) => formateur?.raison_sociale,
        // "Type de l'établissement d'accueil": async ({gestionnaire}) => {
        //   const ufa = await Formateur.findOne({ uai: etablissementFromGestionnaire?.uai });

        //   return ufa?.libelle_type_etablissement ?? "";
        // },
        "Délégation autorisée": ({ gestionnaire, formateur }) =>
          ouiNon(
            gestionnaire.etablissements.find((etablissement) => etablissement.uai === formateur.uai)?.diffusionAutorisee
          ),
        "Email de contact de l'organisme formateur": async ({ gestionnaire, formateur }) =>
          formateur?.email ??
          gestionnaire.etablissements?.find((etablissement) => etablissement.uai === formateur.uai)?.email,
        "Statut ": async ({ gestionnaire, formateur }) => {
          const voeuxTelechargementsFormateur = formateur.voeux_telechargements?.filter(
            (telechargement) => telechargement.siret === gestionnaire.siret
          );

          const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements?.filter(
            (telechargement) => telechargement.uai === formateur.uai
          );

          const etablissementFromGestionnaire = gestionnaire.etablissements.find(
            (etablissement) => etablissement.uai === formateur.uai
          );

          const voeuxDisponible = etablissementFromGestionnaire?.nombre_voeux > 0;

          switch (etablissementFromGestionnaire?.diffusionAutorisee) {
            case true: {
              switch (true) {
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() >
                        new Date(etablissementFromGestionnaire.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() ===
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === formateur.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsFormateur.length ||
                    !voeuxTelechargementsFormateur.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
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
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsGestionnaire.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsGestionnaire.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() >
                        new Date(etablissementFromGestionnaire.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() ===
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsGestionnaire.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === gestionnaire.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsGestionnaire.length ||
                    !voeuxTelechargementsGestionnaire.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
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
        "Dernière action [libellé technique]": async ({ formateur }) => {
          return formateur.histories?.[formateur.histories.length - 1]?.action;
        },
        Vœux: ({ gestionnaire, formateur }) => {
          const etablissementFromGestionnaire = gestionnaire.etablissements.find(
            (etablissement) => etablissement.uai === formateur.uai
          );

          return ouiNon(etablissementFromGestionnaire?.voeux_date);
        },
        "Nombre de vœux": async ({ gestionnaire, formateur }) =>
          `${await Voeu.countDocuments({
            "etablissement_formateur.uai": formateur?.uai,
            "etablissement_gestionnaire.siret": gestionnaire.siret,
          })}`,
        "Date du dernier import de vœux": ({ gestionnaire, formateur }) => {
          const etablissementFromGestionnaire = gestionnaire.etablissements.find(
            (etablissement) => etablissement.uai === formateur.uai
          );

          return date(etablissementFromGestionnaire?.voeux_date);
        },
        Téléchargement: async ({ gestionnaire, formateur }) => {
          const etablissementFromGestionnaire = gestionnaire.etablissements.find(
            (etablissement) => etablissement.uai === formateur.uai
          );

          if (etablissementFromGestionnaire.diffusionAutorisee) {
            // const etablissementFromFormateur = formateur.etablissements.find((etablissement) => {
            //   etablissement.siret === gestionnaire.siret;
            // });

            return ouiNon(
              !!formateur.voeux_telechargements.find((telechargement) => telechargement.siret === gestionnaire.siret)
            );
          } else {
            // const etablissementFromGestionnaire = etablissementFromGestionnaire;

            return ouiNon(
              !!gestionnaire.voeux_telechargements.find((telechargement) => telechargement.uai === formateur.uai)
            );
          }

          // const lastDownloadDate = getLastDownloadDate({gestionnaire});

          // return ouiNon(!!lastDownloadDate);
        },
        // "Téléchargement effectué pour tous les établissements formateurs liés ?": async ({gestionnaire}) => {
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
        // "Date du dernier téléchargement": ({gestionnaire}) => {
        //   const lastDownloadDate = getLastDownloadDate({gestionnaire});

        //   return date(lastDownloadDate);
        // },
        // "Nombre de vœux téléchargés au moins une fois": async ({gestionnaire}) => {
        //   const lastDownloadDate = getLastDownloadDate({gestionnaire});

        //   return `${
        //     lastDownloadDate
        //       ? await Voeu.countDocuments({
        //           "etablissement_formateur.uai": etablissementFromGestionnaire?.uai,
        //           "etablissement_gestionnaire.siret": data.siret,
        //           $expr: {
        //             $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
        //           },
        //         })
        //       : 0
        //   }`;
        // },
        // "Nombre de vœux jamais téléchargés": async ({gestionnaire}) => {
        //   const lastDownloadDate = getLastDownloadDate({gestionnaire});

        //   return `${
        //     lastDownloadDate
        //       ? await Voeu.countDocuments({
        //           "etablissement_formateur.uai": etablissementFromGestionnaire?.uai,
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
        //           "etablissement_formateur.uai": etablissementFromGestionnaire?.uai,
        //           "etablissement_gestionnaire.siret": data.siret,
        //         })
        //   }`;
        // },
        // "Nombre de vœux à télécharger (nouveau+maj)": async ({gestionnaire}) => {
        //   const lastDownloadDate = getLastDownloadDate({gestionnaire});

        //   return `${
        //     lastDownloadDate
        //       ? await Voeu.countDocuments({
        //           "etablissement_formateur.uai": etablissementFromGestionnaire?.uai,
        //           $expr: {
        //             $lte: [lastDownloadDate, { $last: "$_meta.import_dates" }],
        //           },import { Etablissement } from '../../../../catalogue-apprentissage/server/src/common/model/schema/etablissement.d';

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
