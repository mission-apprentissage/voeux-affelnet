const { Responsable, Formateur, Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV, transformData } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date, number, list } = require("../common/utils/csvUtils.js");
const { UserStatut } = require("../common/constants/UserStatut");
const { fillFormateur, fillResponsable } = require("../common/utils/dataUtils");
const { UserType } = require("../common/constants/UserType");
const { ResponsableActions, FormateurActions } = require("../common/constants/History");

async function download(output, options = {}) {
  const formateurs = new Map();
  const responsables = new Map();

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

  const getResponsable = async (siret, admin) => {
    try {
      if (responsables.get(siret)) {
        return responsables.get(siret);
      } else {
        const responsable = await fillResponsable(await Responsable.findOne({ siret }).lean(), admin);
        responsables.set(siret, responsable);
        return responsable;
      }
    } catch (e) {
      return null;
    }
  };

  const columns = options.columns || {};
  await oleoduc(
    Responsable.aggregate([
      {
        $match: {
          type: UserType.RESPONSABLE,
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
      const responsable = await getResponsable(data.siret, options?.admin);

      const etablissementFromResponsable = responsable?.etablissements_formateur.find(
        (etablissement) => etablissement.uai === formateur?.uai
      );

      const etablissementFromFormateur = formateur?.etablissements_responsable.find(
        (etablissement) => etablissement.siret === responsable?.siret
      );

      const telechargementsByResponsable = responsable?.voeux_telechargements_formateur.filter(
        (voeux_telechargement) => voeux_telechargement.uai === formateur?.uai
      );

      const lastVoeuxTelechargementDateByResponsable = new Date(
        telechargementsByResponsable[telechargementsByResponsable.length - 1]?.date
      );

      const telechargementsByFormateur = formateur?.voeux_telechargements_responsable.filter(
        (voeux_telechargement) => voeux_telechargement.siret === responsable?.siret
      );

      const lastVoeuxTelechargementDateByFormateur = new Date(
        telechargementsByFormateur[telechargementsByFormateur.length - 1]?.date
      );

      return {
        responsable,
        formateur,
        etablissementFromResponsable,
        etablissementFromFormateur,
        lastVoeuxTelechargementDateByResponsable,
        lastVoeuxTelechargementDateByFormateur,
      };
    }),

    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        "Académie de l’organisme responsable": ({ responsable }) => responsable.academie?.nom,

        "Siret de l’organisme responsable": ({ responsable }) => responsable.siret,

        "Uai de l'établissement responsable": ({ responsable }) => responsable.uai,

        "Url du responsable": ({ responsable }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/responsable/${responsable.siret}`,

        "Raison sociale de l’organisme responsable": ({ responsable }) => responsable.raison_sociale,

        "Localité responsable": async ({ responsable }) => {
          return responsable.libelle_ville;
        },

        "Email de contact de l’organisme responsable": ({ responsable }) => responsable.email,

        "Académie de l’organisme formateur": ({ formateur }) => formateur?.academie?.nom,

        "Siret de l'établissement formateur": ({ formateur }) => formateur?.siret,

        "Uai de l'établissement formateur": ({ formateur }) => formateur?.uai,

        "Url du formateur": ({ responsable, formateur }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/responsable/${responsable.siret}/formateur/${formateur?.uai}`,

        "Raison sociale de l’établissement formateur": ({ formateur }) => formateur?.raison_sociale,

        "Localité formateur": async ({ formateur }) => {
          return formateur.libelle_ville;
        },

        "Localité des établissements d'accueil": async ({ responsable, formateur }) => {
          return list(
            (
              await Voeu.aggregate([
                {
                  $match: {
                    "etablissement_formateur.uai": formateur.uai,
                    "etablissement_responsable.siret": responsable.siret,
                  },
                },
                { $group: { _id: "$etablissement_accueil.ville" } },
              ])
            ).map((result) => result._id)
          );
        },

        "Délégation autorisée": ({ responsable, formateur }) =>
          ouiNon(
            responsable.etablissements_formateur.find((etablissement) => etablissement.uai === formateur?.uai)
              ?.diffusionAutorisee
          ),

        "Email de contact de l'organisme formateur": async ({ responsable, formateur }) =>
          formateur?.email ??
          responsable.etablissements_formateur?.find((etablissement) => etablissement.uai === formateur?.uai)?.email,

        "Statut ": async ({ responsable, formateur, etablissementFromResponsable }) => {
          const voeuxTelechargementsFormateur = formateur?.voeux_telechargements_responsable?.filter(
            (telechargement) => telechargement.siret === responsable.siret
          );

          const voeuxTelechargementsResponsable = responsable.voeux_telechargements_formateur?.filter(
            (telechargement) => telechargement.uai === formateur?.uai
          );

          const voeuxDisponible = etablissementFromResponsable?.nombre_voeux > 0;

          switch (etablissementFromResponsable?.diffusionAutorisee) {
            case true: {
              switch (true) {
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
                    new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromResponsable.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
                    new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() >
                        new Date(etablissementFromResponsable.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromResponsable.first_date_voeux).getTime() ===
                    new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsFormateur?.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromResponsable.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === formateur?.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsFormateur?.length ||
                    !voeuxTelechargementsFormateur?.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(etablissementFromResponsable.last_date_voeux).getTime()
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
                case UserStatut.ACTIVE === responsable.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
                    new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsResponsable.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromResponsable.last_date_voeux).getTime()
                  ): {
                  return "✅ Mise à jour téléchargée";
                }
                case UserStatut.ACTIVE === responsable.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
                    new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsResponsable.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() <=
                        new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                      new Date(telechargement.date).getTime() >
                        new Date(etablissementFromResponsable.first_date_voeux).getTime()
                  ): {
                  return "⚠️ Mise à jour non téléchargée";
                }
                case UserStatut.ACTIVE === responsable.statut &&
                  voeuxDisponible &&
                  new Date(etablissementFromResponsable.first_date_voeux).getTime() ===
                    new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
                  !!voeuxTelechargementsResponsable.find(
                    (telechargement) =>
                      new Date(telechargement.date).getTime() >
                      new Date(etablissementFromResponsable.last_date_voeux).getTime()
                  ): {
                  return "✅ Liste téléchargée";
                }
                case UserStatut.ACTIVE === responsable.statut &&
                  voeuxDisponible &&
                  (!voeuxTelechargementsResponsable.length ||
                    !voeuxTelechargementsResponsable.find(
                      (telechargement) =>
                        new Date(telechargement.date).getTime() >
                        new Date(etablissementFromResponsable.last_date_voeux).getTime()
                    )): {
                  return "⚠️ Compte créé, liste non téléchargée";
                }
                case UserStatut.ACTIVE === responsable.statut && !voeuxDisponible: {
                  return "✅ Compte créé";
                }
                case UserStatut.CONFIRME === responsable.statut: {
                  return "⚠️ Email confirmé, compte non créé";
                }
                case !!responsable.emails.length && UserStatut.EN_ATTENTE === responsable.statut: {
                  return "⚠️ En attente de confirmation d'email";
                }
                case !responsable.emails.length && UserStatut.EN_ATTENTE === responsable.statut: {
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

        Vœux: ({ etablissementFromResponsable }) => {
          return ouiNon(etablissementFromResponsable?.voeux_date);
        },

        "Nombre de vœux": async ({ responsable, formateur }) =>
          `${await Voeu.countDocuments({
            "etablissement_formateur.uai": formateur?.uai,
            "etablissement_responsable.siret": responsable.siret,
          })}`,

        "Date du dernier import de vœux": ({ etablissementFromResponsable }) => {
          return date(etablissementFromResponsable?.last_date_voeux);
        },

        Téléchargement: async ({ responsable, formateur, etablissementFromResponsable }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            return ouiNon(
              !!formateur?.voeux_telechargements_responsable.find(
                (telechargement) => telechargement.siret === responsable.siret
              )
            );
          } else {
            return ouiNon(
              !!responsable.voeux_telechargements_formateur.find(
                (telechargement) => telechargement.uai === formateur?.uai
              )
            );
          }
        },

        "Date du dernier téléchargement": ({ responsable, formateur, etablissementFromResponsable }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            const voeuxTelechargementsFormateur = formateur?.voeux_telechargements_responsable?.filter(
              (telechargement) => telechargement.siret === responsable.siret
            );

            return date(voeuxTelechargementsFormateur[voeuxTelechargementsFormateur?.length - 1]?.date);
          } else {
            const voeuxTelechargementsResponsable = responsable.voeux_telechargements_formateur?.filter(
              (telechargement) => telechargement.uai === formateur?.uai
            );

            return date(voeuxTelechargementsResponsable[voeuxTelechargementsResponsable.length - 1]?.date);
          }
        },

        "Vœux téléchargés par le destinataire principal": async ({
          responsable,
          formateur,
          etablissementFromResponsable,
          lastVoeuxTelechargementDateByResponsable,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByFormateur, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          }
        },

        "Vœux à jour téléchargés par le destinataire principal": async ({
          responsable,
          formateur,
          etablissementFromResponsable,
          lastVoeuxTelechargementDateByResponsable,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByFormateur, { $last: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByResponsable, { $last: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          }
        },

        "Vœux à télécharger par le destinataire principal": async ({
          responsable,
          formateur,
          etablissementFromResponsable,
          lastVoeuxTelechargementDateByResponsable,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $lte: [lastVoeuxTelechargementDateByFormateur, { $last: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                  })
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $lte: [lastVoeuxTelechargementDateByResponsable, { $last: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                  })
            );
          }
        },

        "Vœux à retélécharger pour mise à jour": async ({
          responsable,
          formateur,
          etablissementFromResponsable,
          lastVoeuxTelechargementDateByResponsable,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $and: [
                      {
                        $expr: {
                          $gt: [lastVoeuxTelechargementDateByFormateur, { $first: "$_meta.import_dates" }],
                        },
                      },
                      {
                        $expr: {
                          $lte: [lastVoeuxTelechargementDateByFormateur, { $last: "$_meta.import_dates" }],
                        },
                      },
                    ],
                  })
                : 0
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
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
          etablissementFromResponsable,
          lastVoeuxTelechargementDateByResponsable,
          lastVoeuxTelechargementDateByFormateur,
        }) => {
          if (etablissementFromResponsable?.diffusionAutorisee) {
            return number(
              lastVoeuxTelechargementDateByFormateur
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByFormateur, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                  })
            );
          } else {
            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "etablissement_formateur.uai": formateur?.uai,
                    "etablissement_responsable.siret": responsable.siret,
                  })
            );
          }
        },

        "Intervention d'un administrateur": async ({ responsable, formateur }) => {
          const admins = [
            ...new Set(
              [
                ...responsable.histories.filter((history) =>
                  [ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN].includes(history?.action)
                ),
                ...formateur.histories.filter((history) =>
                  [
                    FormateurActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN,
                    FormateurActions.DELEGATION_CANCELLED_BY_ADMIN,
                    FormateurActions.DELEGATION_CREATED_BY_ADMIN,
                    FormateurActions.DELEGATION_UPDATED_BY_ADMIN,
                  ].includes(history?.action)
                ),
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
