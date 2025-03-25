const { USER_TYPE } = require("../constants/UserType");

const isAdmin = (user) => {
  return user.type === USER_TYPE.ADMIN;
};

const isAcademie = (user) => {
  return user.type === USER_TYPE.ACADEMIE;
};

const isCsaio = (user) => {
  return user.type === USER_TYPE.CSAIO;
};

const isEtablissement = (user) => {
  return user.type === USER_TYPE.ETABLISSEMENT;
};

const isDelegue = (user) => {
  return user.type === USER_TYPE.DELEGUE;
};

module.exports = {
  isAdmin,
  isAcademie,
  isCsaio,
  isEtablissement,
  isDelegue,
};
