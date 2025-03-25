import { isAdmin, isAcademie } from "./aclUtils";

export const getUserType = (auth) => {
  switch (true) {
    case isAdmin(auth):
      return "admin";
    case isAcademie(auth):
      return "academie";
    default:
      return auth?.type?.toLowerCase();
  }
};
