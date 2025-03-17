const { Voeu, Relation, Delegue, Etablissement } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date, number, list } = require("../common/utils/csvUtils");
const { USER_STATUS } = require("../common/constants/UserStatus");
const { USER_TYPE } = require("../common/constants/UserType");
const { DOWNLOAD_TYPE } = require("../common/constants/DownloadType");
const { ResponsableActions, DelegueActions, RelationActions } = require("../common/constants/History");

async function download(output, options = {}) {
  const columns = options.columns || {};

  console.log(output, options);
  await oleoduc(
    Relation.aggregate([
      {
        $match: {
          ...(options.academies ? { "academie.code": { $in: options.academies } } : {}),
        },
      },
      { $sort: { "academie.code": 1 } },
      {
        $lookup: {
          from: Etablissement.collection.name,
          localField: "etablissement_formateur.siret",
          foreignField: "siret",
          as: "formateur",
        },
      },
      {
        $lookup: {
          from: Etablissement.collection.name,
          localField: "etablissement_responsable.siret",
          foreignField: "siret",
          as: "responsable",
        },
      },

      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_responsable: "$etablissement_responsable.siret",
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
              },
            },

            {
              $unwind: {
                path: "$relations",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$relations.etablissement_responsable.siret", "$$siret_responsable"] },
                    { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                    { $eq: ["$relations.active", true] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$_id",
                root: {
                  $first: "$$ROOT",
                },
              },
            },
            {
              $replaceRoot: {
                newRoot: "$root",
              },
            },
            {
              $project: { password: 0 },
            },
          ],
          as: "delegue",
        },
      },

      {
        $unwind: {
          path: "$responsable",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$formateur",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$delegue",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          responsable: { $exists: true },
          formateur: { $exists: true },
        },
      },
      { $sort: { "academie.code": 1, nombre_voeux: -1 } },
    ])
      .allowDiskUse(true)
      .cursor(),

    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        "Académie de l’organisme responsable": ({ responsable }) => responsable?.academie?.nom,

        "Siret de l'établissement responsable": ({ responsable }) => responsable?.siret,

        "Url du responsable": ({ responsable }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/responsable/${responsable?.siret}`,

        "Raison sociale de l’organisme responsable": ({ responsable }) => responsable?.raison_sociale,

        "Localité responsable": async ({ responsable }) => {
          return responsable?.libelle_ville;
        },

        "Email de contact de l’organisme responsable": ({ responsable }) => responsable?.email,

        "Académie de l’organisme formateur": ({ formateur }) => formateur?.academie?.nom,

        "Siret de l'établissement formateur": ({ formateur }) => formateur?.siret,

        "Url du formateur": ({ responsable, formateur }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/responsable/${responsable?.siret}/formateur/${formateur?.siret}`,

        "Raison sociale de l’établissement formateur": ({ formateur }) => formateur?.raison_sociale,

        "Localité formateur": async ({ formateur }) => {
          return formateur?.libelle_ville;
        },

        "Localité des établissements d'accueil": async ({ responsable, formateur }) => {
          return list(
            (
              await Voeu.aggregate([
                {
                  $match: {
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                  },
                },
                { $group: { _id: "$etablissement_accueil.ville" } },
              ])
            ).map((result) => result._id)
          );
        },

        "Délégation autorisée": ({ delegue }) => ouiNon(!!delegue),

        "Email du délégué": async ({ delegue }) => delegue?.email,

        "Statut ": async ({
          responsable,
          delegue,
          nombre_voeux,
          first_date_voeux,
          last_date_voeux,
          voeux_telechargements,
        }) => {
          const voeuxTelechargementsDelegue = voeux_telechargements?.filter(
            (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.DELEGUE
          );

          const voeuxTelechargementsResponsable = voeux_telechargements?.filter(
            (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.RESPONSABLE
          );

          const voeuxDisponible = nombre_voeux > 0;

          switch (!!delegue) {
            case true: {
              switch (true) {
                case USER_STATUS.ACTIVE === delegue?.statut &&
                  voeuxDisponible &&
                  new Date(first_date_voeux).getTime() !== new Date(last_date_voeux).getTime() &&
                  !!voeuxTelechargementsDelegue?.find(
                    (telechargement) => new Date(telechargement.date).getTime() > new Date(last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case USER_STATUS.ACTIVE === delegue?.statut &&
                  voeuxDisponible &&
                  new Date(first_date_voeux).getTime() !== new Date(last_date_voeux).getTime() &&
                  !!voeuxTelechargementsDelegue?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <= new Date(last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() > new Date(first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case USER_STATUS.ACTIVE === delegue?.statut &&
                  voeuxDisponible &&
                  new Date(first_date_voeux).getTime() === new Date(last_date_voeux).getTime() &&
                  !!voeuxTelechargementsDelegue?.find(
                    (telechargement) => new Date(telechargement.date).getTime() > new Date(last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case USER_STATUS.ACTIVE === delegue?.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsDelegue?.length ||
                    !voeuxTelechargementsDelegue?.find(
                      (telechargement) => new Date(telechargement.date).getTime() > new Date(last_date_voeux).getTime()
                    )): {
                  return "⚠️ Compte créé, liste non téléchargée";
                }
                case USER_STATUS.ACTIVE === delegue?.statut && !voeuxDisponible: {
                  return "✅ Compte créé";
                }
                case USER_STATUS.CONFIRME === delegue?.statut: {
                  return "⚠️ Délégation activée, compte non créé";
                }
                case !!delegue?.emails.length && USER_STATUS.EN_ATTENTE === delegue?.statut: {
                  return "⚠️ En attente de confirmation d'email";
                }
                case !delegue?.emails.length && USER_STATUS.EN_ATTENTE === delegue?.statut: {
                  return "✅ En attente de diffusion de campagne";
                }
                default: {
                  return "⚠️ Etat inconnu";
                }
              }
            }
            case false: {
              switch (true) {
                case USER_STATUS.ACTIVE === responsable?.statut &&
                  voeuxDisponible &&
                  new Date(first_date_voeux).getTime() !== new Date(last_date_voeux).getTime() &&
                  !!voeuxTelechargementsResponsable.find(
                    (telechargement) => new Date(telechargement.date).getTime() > new Date(last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case USER_STATUS.ACTIVE === responsable?.statut &&
                  voeuxDisponible &&
                  new Date(first_date_voeux).getTime() !== new Date(last_date_voeux).getTime() &&
                  !!voeuxTelechargementsResponsable.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <= new Date(last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() > new Date(first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case USER_STATUS.ACTIVE === responsable?.statut &&
                  voeuxDisponible &&
                  new Date(first_date_voeux).getTime() === new Date(last_date_voeux).getTime() &&
                  !!voeuxTelechargementsResponsable.find(
                    (telechargement) => new Date(telechargement.date).getTime() > new Date(last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case USER_STATUS.ACTIVE === responsable?.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsResponsable.length ||
                    !voeuxTelechargementsResponsable.find(
                      (telechargement) => new Date(telechargement.date).getTime() > new Date(last_date_voeux).getTime()
                    )): {
                  return "⚠️ Compte créé, liste non téléchargée";
                }
                case USER_STATUS.ACTIVE === responsable?.statut && !voeuxDisponible: {
                  return "✅ Compte créé";
                }
                case USER_STATUS.CONFIRME === responsable?.statut: {
                  return "⚠️ Email confirmé, compte non créé";
                }
                case !!responsable.emails.length && USER_STATUS.EN_ATTENTE === responsable?.statut: {
                  return "⚠️ En attente de confirmation d'email";
                }
                case !responsable.emails.length && USER_STATUS.EN_ATTENTE === responsable?.statut: {
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

        "Dernière action [libellé technique]": async ({ histories }) => {
          return histories?.[histories.length - 1]?.action;
        },

        // Vœux: ({ first_voeux_date }) => {
        //   return ouiNon(first_voeux_date);
        // },

        "Nombre de vœux": async ({ nombre_voeux }) => number(nombre_voeux),

        "Date du dernier import de vœux": ({ last_date_voeux }) => {
          return date(last_date_voeux);
        },

        Téléchargement: async ({ voeux_telechargements, delegue }) => {
          if (delegue) {
            return ouiNon(
              !!voeux_telechargements.find((telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.DELEGUE)
            );
          } else {
            return ouiNon(
              !!voeux_telechargements.find(
                (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.RESPONSABLE
              )
            );
          }
        },

        "Date du dernier téléchargement": ({ voeux_telechargements, delegue }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            return date(lastVoeuxTelechargementDateByDelegue);
          } else {
            const voeuxTelechargementsResponsable = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return date(lastVoeuxTelechargementDateByResponsable);
          }
        },

        "Vœux téléchargés par le destinataire principal": async ({
          voeux_telechargements,
          responsable,
          formateur,
          delegue,
        }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            console.log({
              responsable,
              formateur,
              delegue,
              voeux_telechargements,
              voeuxTelechargementsDelegue,
              lastVoeuxTelechargementDateByDelegue,
            });

            return number(
              lastVoeuxTelechargementDateByDelegue
                ? await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByDelegue, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          } else {
            const voeuxTelechargementsResponsable = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          }
        },

        // "Vœux à jour téléchargés par le destinataire principal": async ({
        //   responsable,
        //   formateur,
        //   etablissementFromResponsable,
        //   lastVoeuxTelechargementDateByResponsable,
        //   lastVoeuxTelechargementDateByDelegue,
        // }) => {
        //   if (etablissementFromResponsable?.diffusion_autorisee) {
        //     return number(
        //       lastVoeuxTelechargementDateByDelegue
        //         ? await Voeu.countDocuments({
        //             "etablissement_formateur.siret": formateur?.siret,
        //             "etablissement_responsable.siret": responsable?.siret,
        //             $expr: {
        //               $gt: [lastVoeuxTelechargementDateByDelegue, { $last: "$_meta.import_dates" }],
        //             },
        //           })
        //         : 0
        //     );
        //   } else {
        //     return number(
        //       lastVoeuxTelechargementDateByResponsable
        //         ? await Voeu.countDocuments({
        //             "etablissement_formateur.siret": formateur?.siret,
        //             "etablissement_responsable.siret": responsable?.siret,
        //             $expr: {
        //               $gt: [lastVoeuxTelechargementDateByResponsable, { $last: "$_meta.import_dates" }],
        //             },
        //           })
        //         : 0
        //     );
        //   }
        // },

        // "Vœux à télécharger par le destinataire principal": async ({
        //   responsable,
        //   formateur,
        //   etablissementFromResponsable,
        //   lastVoeuxTelechargementDateByResponsable,
        //   lastVoeuxTelechargementDateByDelegue,
        // }) => {
        //   if (etablissementFromResponsable?.diffusion_autorisee) {
        //     return number(
        //       lastVoeuxTelechargementDateByDelegue
        //         ? await Voeu.countDocuments({
        //             "etablissement_formateur.siret": formateur?.siret,
        //             "etablissement_responsable.siret": responsable?.siret,
        //             $expr: {
        //               $lte: [lastVoeuxTelechargementDateByDelegue, { $last: "$_meta.import_dates" }],
        //             },
        //           })
        //         : await Voeu.countDocuments({
        //             "etablissement_formateur.siret": formateur?.siret,
        //             "etablissement_responsable.siret": responsable?.siret,
        //           })
        //     );
        //   } else {
        //     return number(
        //       lastVoeuxTelechargementDateByResponsable
        //         ? await Voeu.countDocuments({
        //             "etablissement_formateur.siret": formateur?.siret,
        //             "etablissement_responsable.siret": responsable?.siret,
        //             $expr: {
        //               $lte: [lastVoeuxTelechargementDateByResponsable, { $last: "$_meta.import_dates" }],
        //             },
        //           })
        //         : await Voeu.countDocuments({
        //             "etablissement_formateur.siret": formateur?.siret,
        //             "etablissement_responsable.siret": responsable?.siret,
        //           })
        //     );
        //   }
        // },

        "Vœux à télécharger pour mise à jour": async ({ responsable, formateur, delegue, voeux_telechargements }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByDelegue
                ? await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                    $and: [
                      {
                        $expr: {
                          $gt: [lastVoeuxTelechargementDateByDelegue, { $first: "$_meta.import_dates" }],
                        },
                      },
                      {
                        $expr: {
                          $lte: [lastVoeuxTelechargementDateByDelegue, { $last: "$_meta.import_dates" }],
                        },
                      },
                    ],
                  })
                : 0
            );
          } else {
            const voeuxTelechargementsResponsable = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                    $and: [
                      {
                        $expr: {
                          $gt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                        },
                      },
                      {
                        $expr: {
                          $lte: [lastVoeuxTelechargementDateByResponsable, { $last: "$_meta.import_dates" }],
                        },
                      },
                    ],
                  })
                : 0
            );
          }
        },

        "Vœux jamais téléchargés par le destinataire principal": async ({
          responsable,
          formateur,
          delegue,
          voeux_telechargements,
        }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByDelegue
                ? await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByDelegue, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                  })
            );
          } else {
            const voeuxTelechargementsResponsable = voeux_telechargements.filter(
              (telechargement) => telechargement.DOWNLOAD_TYPE === DOWNLOAD_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.siret": formateur?.siret,
                    "etablissement_responsable.siret": responsable?.siret,
                  })
            );
          }
        },

        "Intervention par un administrateur": async ({ responsable, delegue, relation }) => {
          const admins = [
            ...new Set(
              [
                ...(responsable?.histories?.filter((history) =>
                  [ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN].includes(history?.action)
                ) ?? []),
                ...(relation?.histories?.filter((history) =>
                  [
                    RelationActions.DELEGATION_CANCELLED_BY_ADMIN,
                    RelationActions.DELEGATION_CREATED_BY_ADMIN,
                    RelationActions.DELEGATION_UPDATED_BY_ADMIN,
                  ].includes(history?.action)
                ) ?? []),
                ...(delegue?.histories?.filter((history) =>
                  [DelegueActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN].includes(history?.action)
                ) ?? []),
              ].map((history) => history?.variables?.admin)
            ),
          ];

          return list(admins);
        },

        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { download };
