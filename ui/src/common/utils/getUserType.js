import { UserType } from "../constants/UserType";

export const getUserType = (auth) => {
  return auth?.permissions?.isAdmin ? "admin" : auth?.type?.toLowerCase();
};

export const isAdmin = (auth) => {
  return getUserType(auth) === "admin";
};

// export const isAcademie = (auth) => {
//   return getUserType(auth) === "admin";
// };

export const isCsaio = (auth) => {
  return getUserType(auth) === UserType.CSAIO;
};

export const isResponsableFormateur = ({ responsable, formateur }) => {
  return responsable?.uai === formateur?.uai;
};
