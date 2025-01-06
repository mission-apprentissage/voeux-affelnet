const { findAcademieByCode } = require("../common/academies");
const { UserStatut } = require("../common/constants/UserStatut");

const logger = require("../common/logger");
const { User, Academie } = require("../common/model");

async function createAdmin(username, email, codesAcademie) {
  logger.info(`Création de l'admin ${username}...`);

  let academies = codesAcademie
    ? codesAcademie.split(",").map((codeAcademie) => findAcademieByCode(codeAcademie))
    : undefined;

  // console.log({ codesAcademie, academies });

  codesAcademie
    ? await Academie.create({
        username,
        email,
        isAdmin: true,
        statut: UserStatut.CONFIRME,
        academies,
      })
    : await User.create({
        username,
        email,
        isAdmin: true,
        statut: UserStatut.CONFIRME,
      });
}
module.exports = { createAdmin };
