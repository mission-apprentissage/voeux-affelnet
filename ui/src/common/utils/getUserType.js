export const getUserType = (auth) => {
  return auth?.permissions?.isAdmin ? "admin" : auth?.type?.toLowerCase();
};

export const isAdmin = (auth) => {
  return getUserType(auth) === "admin";
};

export const isAcademie = (auth) => {
  return getUserType(auth) === "Academie";
};

export const isCsaio = (auth) => {
  return getUserType(auth) === "Csaio";
};

export const isFormateur = (auth) => {
  return getUserType(auth) === "Formateur";
};

export const isGestionnaire = (auth) => {
  return getUserType(auth) === "Gestionnaire";
};

export const isResponsableFormateur = ({ gestionnaire, formateur }) => {
  return gestionnaire.siret === formateur.siret || gestionnaire.uai === formateur.uai;
};

// const userTypes = new Map([
//   ["Gestionnaire", "Organisme responsable"],
//   ["Formateur", "Organisme formateur"],
// ]);

// const userLibelles = new Map([
//   ["Gestionnaire", (self) => `${self.raison_sociale} (${self.siret})`],
//   ["Formateur", (self) => `${self.raison_sociale} (${self.libelle_ville})`],
// ]);

// export const getUserTypeLibelle = (user) => {
//   return userTypes.get(user?.type) ?? user?.type;
// };

// export const getUserLibelle = (user) => {
//   return userLibelles.get(user?.type)?.(user) ?? user?.username;
// };
