const { Gestionnaire, Formateur, Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV, transformData } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date, number } = require("../common/utils/csvUtils.js");
const { UserStatut } = require("../common/constants/UserStatut");
const { fillFormateur, fillGestionnaire } = require("../common/utils/dataUtils");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");

async function download(output, options = {}) {
  const formateurs = new Map();
  const gestionnaires = new Map();

  logger.warn("download", { options });

  const getFormateur = async (uai, admin) => {
    try {
      if (formateurs.get(uai)) {
        return formateurs.get(uai);
      } else {
        const formateur = await fillFormateur(await Formateur?.findOne({ uai }).lean(), admin);
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
          type: UserType.GESTIONNAIRE,
          statut: { $ne: UserStatut.NON_CONCERNE },
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

      const etablissementFromGestionnaire = gestionnaire?.etablissements.find(
        (etablissement) => etablissement.uai === formateur?.uai
      );

      const etablissementFromFormateur = formateur?.etablissements.find(
        (etablissement) => etablissement.siret === gestionnaire?.siret
      );

      const telechargementsByGestionnaire = gestionnaire?.voeux_telechargements.filter(
        (voeux_telechargement) => voeux_telechargement.uai === formateur?.uai
      );

      const lastVoeuxTelechargementDateByGestionnaire = new Date(
        telechargementsByGestionnaire[telechargementsByGestionnaire.length - 1]?.date
      );

      const telechargementsByFormateur = formateur?.voeux_telechargements.filter(
        (voeux_telechargement) => voeux_telechargement.siret === gestionnaire?.siret
      );

      const lastVoeuxTelechargementDateByFormateur = new Date(
        telechargementsByFormateur[telechargementsByFormateur.length - 1]?.date
      );

      return {
        gestionnaire,
        formateur,
        etablissementFromGestionnaire,
        etablissementFromFormateur,
        lastVoeuxTelechargementDateByGestionnaire,
        lastVoeuxTelechargementDateByFormateur,
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

        "Délégation autorisée": ({ gestionnaire, formateur }) =>
          ouiNon(
            gestionnaire.etablissements.find((etablissement) => etablissement.uai === formateur?.uai)
              ?.diffusionAutorisee
          ),

        "Email de contact de l'organisme formateur": async ({ gestionnaire, formateur }) =>
          formateur?.email ??
          gestionnaire.etablissements?.find((etablissement) => etablissement.uai === formateur?.uai)?.email,

        "Statut ": async ({ gestionnaire, formateur, etablissementFromGestionnaire }) => {
          const voeuxTelechargementsFormateur = formateur?.voeux_telechargements?.filter(
            (telechargement) => telechargement.siret === gestionnaire.siret
          );

          const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements?.filter(
            (telechargement) => telechargement.uai === formateur?.uai
          );

          const voeuxDisponible = etablissementFromGestionnaire?.nombre_voeux > 0;

          switch (etablissementFromGestionnaire?.diffusionAutorisee) {
            case true: {
              switch (true) {
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() >
                        new Date(etablissementFromGestionnaire.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromGestionnaire.first_date_voeux).getTime() ===
                    new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsFormateur?.length ||
                    !voeuxTelechargementsFormateur?.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
                    )): {
                  return "⚠️ Compte créé, liste non téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut && !voeuxDisponible: {
                  return "✅ Compte créé";
                }
                case UserStatut.CONFIRME === formateur?.statut: {
                  return "⚠️ Délégation activée, compte non créé";
                }
                case !!formateur?.emails.length && UserStatut.EN_ATTENTE === formateur?.statut: {
                  return "⚠️ En attente de confirmation d'email";
                }
                case !formateur?.emails.length && UserStatut.EN_ATTENTE === formateur?.statut: {
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
          return formateur?.histories?.[formateur?.histories.length - 1]?.action;
        },

        Vœux: ({ etablissementFromGestionnaire }) => {
          return ouiNon(etablissementFromGestionnaire?.voeux_date);
        },

        "Nombre de vœux": async ({ gestionnaire, formateur }) =>
          `${await Voeu.countDocuments({
            "etablissement_formateur.uai": formateur?.uai,
            "etablissement_gestionnaire.siret": gestionnaire.siret,
          })}`,

        "Date du dernier import de vœux": ({ etablissementFromGestionnaire }) => {
          return date(etablissementFromGestionnaire?.voeux_date);
        },

        Téléchargement: async ({ gestionnaire, formateur, etablissementFromGestionnaire }) => {
          if (etablissementFromGestionnaire?.diffusionAutorisee) {
            return ouiNon(
              !!formateur?.voeux_telechargements.find((telechargement) => telechargement.siret === gestionnaire.siret)
            );
          } else {
            return ouiNon(
              !!gestionnaire.voeux_telechargements.find((telechargement) => telechargement.uai === formateur?.uai)
            );
          }
        },

        "Date du dernier téléchargement": ({ gestionnaire, formateur, etablissementFromGestionnaire }) => {
          if (etablissementFromGestionnaire?.diffusionAutorisee) {
            const voeuxTelechargementsFormateur = formateur?.voeux_telechargements?.filter(
              (telechargement) => telechargement.siret === gestionnaire.siret
            );

            return date(voeuxTelechargementsFormateur[voeuxTelechargementsFormateur?.length - 1]?.date);
          } else {
            const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements?.filter(
              (telechargement) => telechargement.uai === formateur?.uai
            );

            return date(voeuxTelechargementsGestionnaire[voeuxTelechargementsGestionnaire.length - 1]?.date);
          }
        },

        "Vœux téléchargés par le destinataire principal": async ({
          gestionnaire,
          formateur,
          etablissementFromGestionnaire,
          lastVoeuxTelechargementDateByGestionnaire,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromGestionnaire?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByFormateur, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByGestionnaire
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByGestionnaire, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          }
        },

        "Vœux à jour téléchargés par le destinataire principal": async ({
          gestionnaire,
          formateur,
          etablissementFromGestionnaire,
          lastVoeuxTelechargementDateByGestionnaire,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromGestionnaire?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByFormateur, { $last: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByGestionnaire
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByGestionnaire, { $last: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          }
        },

        "Vœux à télécharger par le destinataire principal": async ({
          gestionnaire,
          formateur,
          etablissementFromGestionnaire,
          lastVoeuxTelechargementDateByGestionnaire,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromGestionnaire?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $lte: [lastVoeuxTelechargementDateByFormateur, { $last: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                  })
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByGestionnaire
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $lte: [lastVoeuxTelechargementDateByGestionnaire, { $last: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                  })
            );
          }
        },

        "Vœux jamais téléchargés par le destinataire principal": async ({
          gestionnaire,
          formateur,
          etablissementFromGestionnaire,
          lastVoeuxTelechargementDateByGestionnaire,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromGestionnaire?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByFormateur, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                  })
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByGestionnaire
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByGestionnaire, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_gestionnaire.siret": gestionnaire.siret,
                  })
            );
          }
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
