export function getUserType(auth) {
  return auth.permissions.isAdmin ? "admin" : auth.type?.toLowerCase();
}
