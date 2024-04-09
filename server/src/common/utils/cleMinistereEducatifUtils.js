const getSiretResponsableFromCleMinistereEducatif = (cle_ministere_educatif, siret_responsable) => {
  return cle_ministere_educatif ? cle_ministere_educatif.slice(11, -24) : siret_responsable;
};

const getSiretFormateurFromCleMinistereEducatif = (cle_ministere_educatif, siret_formateur) => {
  return cle_ministere_educatif ? cle_ministere_educatif.slice(25, -10) : siret_formateur;
};

module.exports = {
  getSiretResponsableFromCleMinistereEducatif,
  getSiretFormateurFromCleMinistereEducatif,
};
