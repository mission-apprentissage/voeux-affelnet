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

module.exports = {
  getTelechargements,
  isTelechargementTotal,
  isTelechargementPartiel,
  isTelechargementAucun,
  areTelechargementsTotal,
  areTelechargementsPartiel,
  areTelechargementsAucun,
};
