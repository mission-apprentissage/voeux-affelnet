import { USER_TYPE } from "../constants/UserType";

// export const isAcademie = (auth) => {
//   return auth?.type === USER_TYPE.ACADEMIE;
// };

// export const isCsaio = (auth) => {
//   return getUserType(auth) === USER_TYPE.CSAIO;
// };

export const isAdmin = (user) => {
  return user.type === USER_TYPE.ADMIN;
};

export const isAcademie = (user) => {
  return user.type === USER_TYPE.ACADEMIE;
};

export const isCsaio = (user) => {
  return user.type === USER_TYPE.CSAIO;
};

export const isEtablissement = (user) => {
  return user.type === USER_TYPE.ETABLISSEMENT;
};

export const isDelegue = (user) => {
  return user.type === USER_TYPE.DELEGUE;
};
