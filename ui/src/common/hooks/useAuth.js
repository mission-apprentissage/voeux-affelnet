import { useAuthState, anonymous } from "../auth";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  const [auth, setAuth] = useAuthState();

  const setAuthFromToken = (token) => {
    if (!token) {
      localStorage.removeItem("voeux-affelnet:token");
      setAuth(anonymous);
    } else {
      localStorage.setItem("voeux-affelnet:token", token);
      setAuth(decodeJWT(token));
    }
  };

  return [auth, setAuthFromToken];
}
