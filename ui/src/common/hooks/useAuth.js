import { useAuthState, anonymous } from "../auth";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  const [auth, setAuth] = useAuthState();

  const setAuthFromToken = (token) => {
    if (!token) {
      sessionStorage.removeItem("voeux-affelnet:token");
      setAuth(anonymous);
    } else {
      sessionStorage.setItem("voeux-affelnet:token", token);
      setAuth(decodeJWT(token));
    }
  };

  return [auth, setAuthFromToken];
}
