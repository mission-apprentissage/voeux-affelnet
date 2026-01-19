const { Voeu, Relation, Delegue, Etablissement, Formation } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date, number, list } = require("../common/utils/csvUtils");
const { USER_STATUS } = require("../common/constants/UserStatus");
const { USER_TYPE } = require("../common/constants/UserType");
const { CONTACT_TYPE } = require("../common/constants/ContactType");
const { ResponsableActions, DelegueActions, RelationActions } = require("../common/constants/History");
const { CONTACT_STATUS } = require("../common/constants/ContactStatus");

async function downloadByFormation(output, options = {}) {
  const columns = options.columns || {};

  console.log(output, options);

  await oleoduc(
    Formation.aggregate([
      {
        $lookup: {
          from: Etablissement.collection.name,
          localField: "siret_uai_gestionnaire",
          foreignField: "siret",
          as: "responsable",
        },
      },
      {
        $lookup: {
          from: Etablissement.collection.name,
          localField: "siret_uai_formateur",
          foreignField: "siret",
          as: "formateur",
        },
      },
      {
        $lookup: {
          from: Relation.collection.name,
          as: "relation",
          let: {
            siret_responsable: "$siret_uai_gestionnaire",
            siret_formateur: "$siret_uai_formateur",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                    { $eq: ["$etablissement_formateur.siret", "$$siret_formateur"] },
                  ],
                },
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_responsable: "$siret_uai_gestionnaire",
            siret_formateur: "$siret_uai_formateur",
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
          path: "$relation",
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
          ...(options.academies ? { "relation.academie.code": { $in: options.academies } } : {}),
        },
      },
      { $sort: { "relation.academie.code": 1 } },

      {
        $match: {
          responsable: { $exists: true },
          formateur: { $exists: true },
        },
      },
      { $sort: { "relation.academie.code": 1, "relation.nombre_voeux": -1 } },
    ])
      .allowDiskUse(true)
      .cursor(),

    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        "Académie de la formation": ({ academie }) => {
          return academie;
        },

        "Code offre de la formation": ({ code_offre }) => {
          return code_offre;
        },

        "Académie de l’organisme responsable": ({ responsable }) => responsable?.academie?.nom,

        "Siret de l'établissement responsable": ({ responsable }) => responsable?.siret,

        "UAI de l'établissement responsable": ({ responsable }) => responsable?.uai,

        "Url du responsable": ({ responsable }) =>
          `${process.env.VOEUX_AFFELNET_PUBLIC_URL}/admin/etablissement/${responsable?.siret}`,

        "Raison sociale de l’organisme responsable": ({ responsable }) => responsable?.raison_sociale,

        "Localité responsable": async ({ responsable }) => {
          return responsable?.libelle_ville;
        },

        "Email de contact de l’organisme responsable": ({ responsable }) => responsable?.email,

        "Académie de l’organisme formateur": ({ formateur }) => formateur?.academie?.nom,

        "Siret de l'établissement formateur": ({ formateur }) => formateur?.siret,

        "UAI de l'établissement formateur": ({ formateur }) => formateur?.uai,

        "Raison sociale de l’établissement formateur": ({ formateur }) => formateur?.raison_sociale,

        "Localité formateur": async ({ formateur }) => {
          return formateur?.libelle_ville;
        },

        "Localité de l'établissement d'accueil": async ({ commune }) => {
          return commune;
        },

        "UAI de l'établissement d'accueil": ({ uai }) => {
          return uai;
        },

        "Délégation autorisée": ({ delegue }) => ouiNon(!!delegue),

        "Email du délégué": async ({ delegue }) => delegue?.email,

        "Statut de création du compte": async ({ responsable, delegue }) => {
          switch (!!delegue) {
            case true: {
              switch (true) {
                case !delegue.email: {
                  return `⚠️ ${CONTACT_STATUS.EMAIL_MANQUANT}`;
                }

                case USER_STATUS.ACTIVE === delegue.statut: {
                  return `✅ ${CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_CREE}`;
                }

                case USER_STATUS.CONFIRME === delegue.statut: {
                  return `⚠️ ${CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_NON_CREE}`;
                }

                case USER_STATUS.EN_ATTENTE === delegue.statut && !!delegue.emails?.length: {
                  return `⚠️ ${CONTACT_STATUS.EN_ATTENTE_DE_CONFIRMATION}`;
                }

                case USER_STATUS.EN_ATTENTE === delegue.statut && !delegue.emails?.length: {
                  return `✅ ${CONTACT_STATUS.EN_ATTENTE_DE_DIFFUSION}`;
                }
                default: {
                  return `⚠️ ${CONTACT_STATUS.INCONNU}`;
                }
              }
            }
            case false: {
              switch (true) {
                case !responsable.email: {
                  return `⚠️ ${CONTACT_STATUS.EMAIL_MANQUANT}`;
                }

                case USER_STATUS.ACTIVE === responsable.statut: {
                  return `✅ ${CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_CREE}`;
                }

                case USER_STATUS.CONFIRME === responsable.statut: {
                  return `⚠️ ${CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_NON_CREE}`;
                }

                case USER_STATUS.EN_ATTENTE === responsable.statut && !!responsable.emails?.length: {
                  return `⚠️ ${CONTACT_STATUS.EN_ATTENTE_DE_CONFIRMATION}`;
                }

                case USER_STATUS.EN_ATTENTE === responsable.statut && !responsable.emails?.length: {
                  return `✅ ${CONTACT_STATUS.EN_ATTENTE_DE_DIFFUSION}`;
                }
                default: {
                  return `⚠️ ${CONTACT_STATUS.INCONNU}`;
                }
              }
            }
          }
        },

        "Statut de diffusion des candidatures": async ({ academie, code_offre, relation }) => {
          const nombre_voeux = await Voeu.countDocuments({
            "formation.affelnet_id": `${academie}/${code_offre}`,
          });

          const lastVoeuxTelechargementDate = relation?.voeux_telechargements?.length
            ? new Date(relation?.voeux_telechargements?.[relation?.voeux_telechargements?.length - 1]?.date)
            : null;

          const nombre_voeux_restant = lastVoeuxTelechargementDate
            ? await Voeu.countDocuments({
                "formation.affelnet_id": `${academie}/${code_offre}`,

                $expr: {
                  $lt: [lastVoeuxTelechargementDate, { $first: "$_meta.import_dates" }],
                },
              })
            : await Voeu.countDocuments({
                "formation.affelnet_id": `${academie}/${code_offre}`,
              });

          // console.log({
          //   affelnet_id: `${academie}/${code_offre}`,

          //   voeux_telechargements: relation?.voeux_telechargements,
          //   lastVoeuxTelechargementDate,

          //   nombre_voeux,
          //   nombre_voeux_restant,
          // });

          const partialDownload = `⚠️ ${nombre_voeux} candidatures, dont ${nombre_voeux_restant} non téléchargées`;
          const noDownload = `⚠️ ${nombre_voeux} candidatures, non téléchargées`;
          const fullDownload = `✅ ${nombre_voeux} candidatures, toutes téléchargées`;
          const noCandidature = `✅ Aucune candidature`;
          const unknown = `⚠️ État inconnu`;

          switch (true) {
            case nombre_voeux && nombre_voeux_restant && nombre_voeux_restant !== nombre_voeux:
              return partialDownload;

            case nombre_voeux && nombre_voeux_restant === nombre_voeux:
              return noDownload;

            case nombre_voeux && !nombre_voeux_restant:
              return fullDownload;

            case !nombre_voeux:
              return noCandidature;

            default: {
              return unknown;
            }
          }
        },

        "Statut générique": async ({ academie, code_offre, relation }) => {
          const nombre_voeux = await Voeu.countDocuments({
            "formation.affelnet_id": `${academie}/${code_offre}`,
          });

          const lastVoeuxTelechargementDate = relation?.voeux_telechargements?.length
            ? new Date(relation?.voeux_telechargements?.[relation?.voeux_telechargements?.length - 1]?.date)
            : null;

          const nombre_voeux_restant = lastVoeuxTelechargementDate
            ? await Voeu.countDocuments({
                "formation.affelnet_id": `${academie}/${code_offre}`,

                $expr: {
                  $lt: [lastVoeuxTelechargementDate, { $first: "$_meta.import_dates" }],
                },
              })
            : await Voeu.countDocuments({
                "formation.affelnet_id": `${academie}/${code_offre}`,
              });

          const partialDownload = `⚠️ Mise à jour non téléchargée`;
          const noDownload = `⚠️ Candidatures non téléchargées`;
          const fullDownload = `✅ Candidatures toutes téléchargées`;
          const noCandidature = `✅ Aucune candidature`;
          const unknown = `⚠️ État inconnu`;

          switch (true) {
            case nombre_voeux && nombre_voeux_restant && nombre_voeux_restant !== nombre_voeux:
              return partialDownload;

            case nombre_voeux && nombre_voeux_restant === nombre_voeux:
              return noDownload;

            case nombre_voeux && !nombre_voeux_restant:
              return fullDownload;

            case !nombre_voeux:
              return noCandidature;

            default: {
              return unknown;
            }
          }
        },

        "Dernière action [libellé technique]": async ({ relation }) => {
          return relation?.histories?.[relation?.histories.length - 1]?.action;
        },

        "Nombre de vœux": async ({ academie, code_offre }) =>
          number(
            await Voeu.countDocuments({
              "formation.affelnet_id": `${academie}/${code_offre}`,
            })
          ),

        "Date du dernier import de vœux": async ({ academie, code_offre }) => {
          const voeuxDate = [
            ...new Set(
              (
                await Voeu.find({
                  "formation.affelnet_id": `${academie}/${code_offre}`,
                })
              )
                .flatMap((voeu) => voeu._meta.import_dates)
                .map((date) => new Date(date).toISOString())
            ),
          ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

          return voeuxDate ? date(new Date(voeuxDate)) : null;
        },

        Téléchargement: async ({ relation, delegue }) => {
          if (delegue) {
            return ouiNon(
              !!relation?.voeux_telechargements.find(
                (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
              )
            );
          } else {
            return ouiNon(
              !!relation?.voeux_telechargements.find(
                (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
              )
            );
          }
        },

        "Date du dernier téléchargement": ({ relation, delegue }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            return date(lastVoeuxTelechargementDateByDelegue);
          } else {
            const voeuxTelechargementsResponsable = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return date(lastVoeuxTelechargementDateByResponsable);
          }
        },

        "Vœux téléchargés par le destinataire principal": async ({ academie, code_offre, relation, delegue }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            // console.log({
            //   responsable,
            //   formateur,
            //   delegue,
            //   relation,
            //   voeuxTelechargementsDelegue,
            //   lastVoeuxTelechargementDateByDelegue,
            // });

            return number(
              lastVoeuxTelechargementDateByDelegue
                ? await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,

                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByDelegue, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          } else {
            const voeuxTelechargementsResponsable = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,

                    $expr: {
                      $gt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                    },
                  })
                : 0
            );
          }
        },

        "Vœux à télécharger pour mise à jour": async ({ academie, code_offre, delegue, relation }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByDelegue
                ? await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,

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
            const voeuxTelechargementsResponsable = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,

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
          academie,
          code_offre,
          delegue,
          relation,
        }) => {
          if (delegue) {
            const voeuxTelechargementsDelegue = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
            );

            const lastVoeuxTelechargementDateByDelegue = voeuxTelechargementsDelegue?.length
              ? new Date(voeuxTelechargementsDelegue?.[voeuxTelechargementsDelegue?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByDelegue
                ? await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,

                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByDelegue, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,
                  })
            );
          } else {
            const voeuxTelechargementsResponsable = relation?.voeux_telechargements.filter(
              (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
            );

            const lastVoeuxTelechargementDateByResponsable = voeuxTelechargementsResponsable?.length
              ? new Date(voeuxTelechargementsResponsable?.[voeuxTelechargementsResponsable?.length - 1]?.date)
              : null;

            return number(
              lastVoeuxTelechargementDateByResponsable
                ? await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,
                    $expr: {
                      $lt: [lastVoeuxTelechargementDateByResponsable, { $first: "$_meta.import_dates" }],
                    },
                  })
                : await Voeu.countDocuments({
                    "formation.affelnet_id": `${academie}/${code_offre}`,
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

module.exports = { downloadByFormation };
