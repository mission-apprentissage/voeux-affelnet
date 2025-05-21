const logger = require("../common/logger");
const { Academie } = require("../common/model");

async function removeAcademie(username) {
  logger.info(`Suppression du compte académie ${username}...`);

  // console.log({ codesAcademie, academies });

  if (!(await Academie.findOne({ username }))) {
    throw new Error(`L'utilisateur ${username} n'existe pas`);
  }

  await Academie.deleteOne({
    username,
  });
}

module.exports = { removeAcademie };
