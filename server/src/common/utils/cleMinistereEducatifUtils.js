const getGestionnaireSiretFromCleMinistereEducatif = (cle_ministere_educatif) => {
  return cle_ministere_educatif.slice(11, -24);
};

const getSiretFormateurFromCleMinistereEducatif = (cle_ministere_educatif) => {
  return cle_ministere_educatif.slice(25, -10);
};

module.exports = {
  getGestionnaireSiretFromCleMinistereEducatif,
  getSiretFormateurFromCleMinistereEducatif,
};
