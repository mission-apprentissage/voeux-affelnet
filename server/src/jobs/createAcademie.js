const { findAcademieByCode } = require("../common/academies");
const { USER_STATUS } = require("../common/constants/UserStatus");

const logger = require("../common/logger");
const { Academie } = require("../common/model");

async function createAcademie(username, email, codesAcademie) {
  logger.info(`Création du compte académie ${username}...`);

  let academies = codesAcademie
    ? codesAcademie.split(",").map((codeAcademie) => findAcademieByCode(codeAcademie))
    : undefined;

  // console.log({ codesAcademie, academies });

  if (!academies.length) {
    throw new Error(`Vous devez fournir une liste d'académies `);
  }

  await Academie.create({
    username,
    email,
    statut: USER_STATUS.CONFIRME,
    academies,
  });
}

module.exports = { createAcademie };
