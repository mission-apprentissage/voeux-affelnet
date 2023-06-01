const { UserType } = require("../constants/UserType.js");
const { Gestionnaire } = require("../model/index.js");
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

const allFilesAsAlreadyBeenDownloaded = async (user) => {
  switch (user.type) {
    case UserType.GESTIONNAIRE: {
      const gestionnaire = user;

      return !gestionnaire.etablissements.filter(
        (etablissement) =>
          !etablissement.diffusionAutorisee &&
          etablissement.nombre_voeux > 0 &&
          !gestionnaire.voeux_telechargements.find(
            (telechargement) =>
              telechargement.uai === etablissement.uai && telechargement.date > etablissement.voeux_date
          )
      )?.length;
    }

    case UserType.FORMATEUR: {
      const formateur = user;

      const gestionnaires = await Gestionnaire.find({ etablissements: { $elemMatch: { uai: formateur.uai } } });

      const etablissements = gestionnaires.flatMap((gestionnaire) =>
        gestionnaire.etablissements.filter((etablissement) => etablissement.uai === formateur.uai)
      );

      return !etablissements.filter(
        (etablissement) =>
          etablissement.diffusionAutorisee &&
          etablissement.nombre_voeux > 0 &&
          !formateur.voeux_telechargements.find(
            (telechargement) =>
              telechargement.siret === etablissement.siret && telechargement.date > etablissement.voeux_date
          )
      )?.length;
    }

    default: {
      return true;
    }
  }
};

module.exports = {
  getTelechargements,
  isTelechargementTotal,
  isTelechargementPartiel,
  isTelechargementAucun,
  areTelechargementsTotal,
  areTelechargementsPartiel,
  areTelechargementsAucun,
  allFilesAsAlreadyBeenDownloaded,
};
