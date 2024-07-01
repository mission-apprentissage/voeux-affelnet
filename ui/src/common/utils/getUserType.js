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

export const isFormateur = (auth) => {
  return getUserType(auth) === UserType.FORMATEUR;
};

export const isResponsable = (auth) => {
  return getUserType(auth) === UserType.RESPONSABLE;
};

export const isResponsableFormateur = ({ responsable, formateur }) => {
  return responsable?.siret === formateur?.siret || responsable?.uai === formateur?.uai;
};

// const userTypes = new Map([
//   ["Responsable", "Organisme responsable"],
//   ["Formateur", "Organisme formateur"],
// ]);

// const userLibelles = new Map([
//   ["Responsable", (self) => `${self.raison_sociale} (${self.siret})`],
//   ["Formateur", (self) => `${self.raison_sociale} (${self.libelle_ville})`],
// ]);

// export const getUserTypeLibelle = (user) => {
//   return userTypes.get(user?.type) ?? user?.type;
// };

// export const getUserLibelle = (user) => {
//   return userLibelles.get(user?.type)?.(user) ?? user?.username;
// };
