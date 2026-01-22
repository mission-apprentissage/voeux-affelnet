import { Navigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getUserType } from "../../utils/getUserType";

export const RequireAuth = ({ children, allowed }) => {
  const [auth] = useAuth();
  const type = getUserType(auth);
  const [searchParams] = useSearchParams();
  const isNotAllowed = allowed && !allowed.map((v) => v.toLowerCase()).includes(type);

  if (!auth || auth.sub === "anonymous" || isNotAllowed) {
    const previousPath = window.location.pathname + window.location.search;

    return (
      <Navigate
        to={`/login?actionToken=${searchParams.get("actionToken")}&redirect=${encodeURIComponent(previousPath)}`}
      />
    );
  }

  return children;
};
