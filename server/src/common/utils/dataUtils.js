const { UserType } = require("../constants/UserType.js");
const logger = require("../logger.js");
const { Voeu, Responsable } = require("../model");
const { sortDescending } = require("./dateUtils.js");

/**
 * Retourne les voeux_telechargements correspondants à l'UAI de l'établissement passé en paramètre
 *
 * @param {*} etablissement
 * @param {*} voeux_telechargements
 * @returns Array<{
        uai: {
          type: String,
          required: true,
          index: true,
        },
        date: {
          type: Date,
          required: true,
          default: () => new Date(),
        },
      }>
 */
const getTelechargements = (etablissement, voeux_telechargements) => {
  return (
    voeux_telechargements?.filter((t) => t.uai === etablissement.uai).sort((a, b) => sortDescending(a.date, b.date)) ??
    []
  );
};

/**
 * Indique si les vœux ont tous été téléchargés pour un établissement donné en se basant sur les dates d'ajout et de téléchargement des vœux
 *
 * @param {*} etablissement
 * @param {*} voeux_telechargements
 * @returns boolean
 */
const isTelechargementTotal = (etablissement, voeux_telechargements) => {
  const telechargements = getTelechargements(etablissement, voeux_telechargements);

  return !!telechargements.length && !!telechargements.filter((t) => t.date >= etablissement.voeux_date).length;
};

/**
 * Indique si les vœux ont été partiellement téléchargés pour un établissement donné en se basant sur les dates d'ajout et de téléchargement des vœux
 *
 * @param {*} etablissement
 * @param {*} voeux_telechargements
 * @returns boolean
 */
const isTelechargementPartiel = (etablissement, voeux_telechargements) => {
  const telechargements = getTelechargements(etablissement, voeux_telechargements);

  return !!telechargements.length && !telechargements.filter((t) => t.date >= etablissement.voeux_date).length;
};

/**
 * Indique si aucun voeux n'a été téléchargés pour un établissement donné en se basant sur les dates d'ajout et de téléchargement des vœux
 *
 * @param {*} etablissement
 * @param {*} voeux_telechargements
 * @returns boolean
 */
const isTelechargementAucun = (etablissement, voeux_telechargements) => {
  const telechargements = getTelechargements(etablissement, voeux_telechargements);

  return !telechargements.length;
};

/**
 * Indique si tous les voeux d'une liste d'établissements ont été téléchargés.
 *
 * @param {*} etablissements
 * @param {*} voeux_telechargements
 * @returns boolean
 */
const areTelechargementsTotal = (etablissements, voeux_telechargements) => {
  return (
    etablissements?.filter((etablissement) => isTelechargementTotal(etablissement, voeux_telechargements)).length ===
    etablissements?.length
  );
};

/**
 * Indique si au moins un établissement d'une liste possèdent des voeux ayant été partiellement téléchargés.
 *
 * @param {*} etablissements
 * @param {*} voeux_telechargements
 * @returns boolean
 */
const areTelechargementsPartiel = (etablissements, voeux_telechargements) => {
  return (
    etablissements.filter((etablissement) => isTelechargementPartiel(etablissement, voeux_telechargements)).length >
      0 ||
    (etablissements.filter((etablissement) => isTelechargementAucun(etablissement, voeux_telechargements)).length > 0 &&
      etablissements.filter((etablissement) => isTelechargementTotal(etablissement, voeux_telechargements)).length > 0)
  );
};

/**
 * Indique si au moins un établissement d'une liste possèdent des voeux ayant été partiellement téléchargés.
 *
 * @param {*} etablissements
 * @param {*} voeux_telechargements
 * @returns boolean
 */
const areTelechargementsAucun = (etablissements, voeux_telechargements) => {
  return (
    etablissements.filter((etablissement) => isTelechargementAucun(etablissement, voeux_telechargements)).length ===
    etablissements.length
  );
};

// TODO : Vérifier le nombre_voeux_restant des relations associées
const allFilesAsAlreadyBeenDownloaded = async (user) => {
  logger.debug("allFilesAsAlreadyBeenDownloaded", user);

  switch (user.type) {
    case UserType.RESPONSABLE: {
      const responsable = user; // await fillResponsable(user);

      // logger.debug(
      //   !responsable.etablissements_formateur.find(
      //     (etablissement) =>
      //       !etablissement.diffusion_autorisee &&
      //       etablissement.nombre_voeux > 0 &&
      //       !responsable.voeux_telechargements_formateur.find(
      //         (telechargement) =>
      //           telechargement.uai === etablissement.uai &&
      //           new Date(telechargement.date).getTime() > new Date(etablissement.last_date_voeux).getTime()
      //       )
      //   )
      // );

      return !responsable.etablissements_formateur.find(
        (etablissement) =>
          !etablissement.diffusion_autorisee &&
          etablissement.nombre_voeux > 0 &&
          !responsable.voeux_telechargements_formateur.find(
            (telechargement) =>
              telechargement.uai === etablissement.uai &&
              new Date(telechargement.date).getTime() > new Date(etablissement.last_date_voeux).getTime()
          )
      );
    }

    case UserType.FORMATEUR: {
      const formateur = user; //await fillFormateur(user);

      const responsables = await Responsable.find({
        etablissements_formateur: { $elemMatch: { uai: formateur?.uai } },
      });

      // const responsables = await Etablissement.find({
      //   "etablissements_formateur.0": { $exists: true },
      //   etablissements_formateur: { $elemMatch: { uai: formateur?.uai } },
      // });

      const etablissements = responsables.flatMap((responsable) =>
        responsable.etablissements_formateur.filter((etablissement) => etablissement.uai === formateur?.uai)
      );

      return !etablissements.find(
        (etablissement) =>
          etablissement.diffusion_autorisee &&
          etablissement.nombre_voeux > 0 &&
          !formateur?.voeux_telechargements_responsable.find(
            (telechargement) =>
              telechargement.siret === etablissement.siret &&
              new Date(telechargement.date).getTime() > new Date(etablissement.last_date_voeux).getTime()
          )
      );
    }

    default: {
      return true;
    }
  }
};

// TODO : Vérifier le last_voeux_date des relations associées
const filesHaveUpdate = async (user) => {
  logger.debug("filesHaveUpdate", user);

  switch (user.type) {
    case UserType.RESPONSABLE: {
      const responsable = user;

      logger.debug(
        !!responsable.etablissements_formateur.find(
          async (etablissement) =>
            !etablissement.diffusion_autorisee &&
            (await Voeu.countDocuments({
              "etablissement_formateur.uai": etablissement.uai,
              "etablissement_responsable.siret": responsable.siret,
              "_meta.import_dates.1": { $exists: true },
            })) > 0
        )
      );

      return !!responsable.etablissements_formateur.find(
        async (etablissement) =>
          !etablissement.diffusion_autorisee &&
          (await Voeu.countDocuments({
            "etablissement_formateur.uai": etablissement.uai,
            "etablissement_responsable.siret": responsable.siret,
            "_meta.import_dates.1": { $exists: true },
          })) > 0
      );
    }

    case UserType.FORMATEUR: {
      const formateur = user;

      const responsables = await Responsable.find({
        etablissements_formateur: { $elemMatch: { uai: formateur?.uai } },
      });

      // const responsables = await Etablissement.find({
      //   etablissements_formateur: { $elemMatch: { uai: formateur?.uai } },
      // });

      const etablissements = responsables.flatMap((responsable) =>
        responsable.etablissements_formateur.filter((etablissement) => etablissement.uai === formateur?.uai)
      );

      return !!etablissements.find(
        async (etablissement) =>
          etablissement.diffusion_autorisee &&
          (await Voeu.countDocuments({
            "etablissement_formateur.uai": formateur?.uai,
            "etablissement_responsable.siret": etablissement.siret,
            "_meta.import_dates.1": { $exists: true },
          })) > 0
      );
    }

    default: {
      return false;
    }
  }
};

const filterForAcademie = (etablissement, user) => {
  return user?.academies
    ? user.academies.map((academie) => academie.code).includes(etablissement.academie?.code)
    : true;
};

// const fillResponsable = async (responsable, admin) => {
//   if (!responsable) {
//     return responsable;
//   }

//   const voeuxFilter = {
//     "etablissement_responsable.siret": responsable?.siret,
//   };

//   return {
//     ...responsable,

//     // nombre_voeux: await Voeu.countDocuments(voeuxFilter).lean(),

//     // etablissements_formateur: await Promise.all(
//     //   responsable?.etablissements_formateur
//     //     .filter((etablissement) => filterForAcademie(etablissement, admin))
//     //     .map(async (etablissement) => {
//     //       const voeuxFilter = {
//     //         "etablissement_formateur.uai": etablissement.uai,
//     //         "etablissement_responsable.siret": responsable.siret,
//     //       };

//     //       const formateur = await Formateur.findOne({
//     //         uai: etablissement.uai,
//     //       });

//     //       // const formateur = await Etablissement.findOne({
//     //       //   "etablissements_responsable.0": { $exists: true },
//     //       //   uai: etablissement.uai,
//     //       // });

//     //       const voeux = await Voeu.find(voeuxFilter);

//     //       const first_date_voeux = etablissement.uai
//     //         ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
//     //         : null;

//     //       const last_date_voeux = etablissement.uai
//     //         ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
//     //         : null;

//     //       const delegue = await Delegue.findOne({
//     //         relations: {
//     //           $elemMatch: {
//     //             active: true,
//     //             "etablissement_responsable.siret": responsable.siret,
//     //             "etablissement_formateur.uai": etablissement.uai,
//     //           },
//     //         },
//     //       });

//     //       const isDiffusionAutorisee = !!delegue?.relations.find(
//     //         (relation) =>
//     //           relation.active &&
//     //           relation.etablissement_responsable.siret === responsable.siret &&
//     //           relation.etablissement_formateur.uai === etablissement.uai
//     //       );

//     //       const downloadsByResponsable =
//     //         responsable?.voeux_telechargements_formateur?.filter((download) => download.uai === etablissement.uai) ??
//     //         [];
//     //       const downloadsByFormateur =
//     //         formateur?.voeux_telechargements_responsable?.filter((download) => download.siret === responsable?.siret) ??
//     //         [];

//     //       const lastDownloadDate = isDiffusionAutorisee
//     //         ? downloadsByFormateur[downloadsByFormateur.length - 1]?.date
//     //         : downloadsByResponsable[downloadsByResponsable.length - 1]?.date;

//     //       return {
//     //         ...etablissement,

//     //         nombre_voeux: /*etablissement.nombre_voeux ?? 0,*/ etablissement.uai
//     //           ? await Voeu.countDocuments(voeuxFilter).lean()
//     //           : 0,
//     //         nombre_voeux_restant: etablissement.uai
//     //           ? await Voeu.countDocuments({
//     //               ...voeuxFilter,
//     //               ...(lastDownloadDate
//     //                 ? {
//     //                     $expr: {
//     //                       $lte: [new Date(lastDownloadDate), { $last: "$_meta.import_dates" }],
//     //                     },
//     //                   }
//     //                 : {}),
//     //             }).lean()
//     //           : 0,

//     //         first_date_voeux,
//     //         last_date_voeux,
//     //       };
//     //     }) ?? []
//     // ),
//   };
// };

// /* eslint-disable-next-line no-unused-vars*/
// const fillFormateur = async (formateur, admin) => {
//   if (!formateur) {
//     return formateur;
//   }

//   const voeuxFilter = {
//     "etablissement_formateur.uai": formateur?.uai,
//   };

//   return {
//     ...formateur,

//     // nombre_voeux: await Voeu.countDocuments(voeuxFilter).lean(),

//     // etablissements_responsable: await Promise.all(
//     //   formateur?.etablissements_responsable
//     //     // .filter((etablissement) => filterForAcademie(etablissement, admin))
//     //     .map(async (etablissement) => {
//     //       const voeuxFilter = {
//     //         "etablissement_formateur.uai": formateur?.uai,
//     //         "etablissement_responsable.siret": etablissement.siret,
//     //       };

//     //       // console.log({ voeuxFilter });
//     //       const voeux = await Voeu.find(voeuxFilter);

//     //       const responsable = await Responsable.findOne({
//     //         siret: etablissement.siret,
//     //       });
//     //       // const responsable = await Etablissement.findOne({
//     //       //   "etablissements_formateur.0": { $exists: true },
//     //       //   siret: etablissement.siret,
//     //       // });

//     //       const first_date_voeux = etablissement.siret
//     //         ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
//     //         : null;

//     //       const last_date_voeux = etablissement.siret
//     //         ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
//     //         : null;

//     //       const delegue = await Delegue.findOne({
//     //         relations: {
//     //           $elemMatch: {
//     //             active: true,
//     //             "etablissement_responsable.siret": etablissement.siret,
//     //             "etablissement_formateur.uai": formateur?.uai,
//     //           },
//     //         },
//     //       });

//     //       const isDiffusionAutorisee = !!delegue?.relations.find(
//     //         (relation) =>
//     //           relation.active &&
//     //           relation.etablissement_responsable.siret === etablissement.siret &&
//     //           relation.etablissement_formateur.uai === formateur?.uai
//     //       );

//     //       const downloadsByResponsable =
//     //         responsable?.voeux_telechargements_formateur?.filter((download) => download.uai === formateur?.uai) ?? [];
//     //       const downloadsByFormateur =
//     //         formateur?.voeux_telechargements_responsable?.filter(
//     //           (download) => download.siret === etablissement.siret
//     //         ) ?? [];

//     //       const lastDownloadDate = isDiffusionAutorisee
//     //         ? downloadsByFormateur[downloadsByFormateur.length - 1]?.date
//     //         : downloadsByResponsable[downloadsByResponsable.length - 1]?.date;

//     //       return {
//     //         ...etablissement,

//     //         nombre_voeux: /*etablissement.nombre_voeux ?? 0,*/ etablissement.siret
//     //           ? await Voeu.countDocuments(voeuxFilter).lean()
//     //           : 0,
//     //         nombre_voeux_restant: etablissement.siret
//     //           ? await Voeu.countDocuments({
//     //               ...voeuxFilter,
//     //               ...(lastDownloadDate
//     //                 ? {
//     //                     $expr: {
//     //                       $lte: [new Date(lastDownloadDate), { $last: "$_meta.import_dates" }],
//     //                     },
//     //                   }
//     //                 : {}),
//     //             }).lean()
//     //           : 0,

//     //         first_date_voeux,
//     //         last_date_voeux,
//     //       };
//     //     }) ?? []
//     // ),
//   };
// };

module.exports = {
  getTelechargements,
  isTelechargementTotal,
  isTelechargementPartiel,
  isTelechargementAucun,
  areTelechargementsTotal,
  areTelechargementsPartiel,
  areTelechargementsAucun,
  allFilesAsAlreadyBeenDownloaded,
  filesHaveUpdate,
  filterForAcademie,
  // fillResponsable,
  // fillFormateur,
};
