const { getGestionnaireSiretFromCleMinistereEducatif } = require("../../common/utils/cleMinistereEducatifUtils.js");

const getGestionnaireSiret = (siret, cle_ministere_educatif) => {
  const siretGestionnaire = cle_ministere_educatif
    ? getGestionnaireSiretFromCleMinistereEducatif(cle_ministere_educatif)
    : siret;

  return siretGestionnaire;
};

module.exports = { getGestionnaireSiret };
