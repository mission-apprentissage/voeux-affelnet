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
