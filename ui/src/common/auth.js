import { createGlobalState } from "react-hooks-global-state";
import { subscribeToHttpEvent } from "./emitter";
import decodeJWT from "./utils/decodeJWT";

export const anonymous = { sub: "anonymous", permissions: {} };
const token = localStorage.getItem("voeux-affelnet:token");

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: token ? decodeJWT(token) : anonymous,
});

subscribeToHttpEvent("http:error", (response) => {
  if (response.status === 401) {
    //Auto logout user when token is invalid
    localStorage.removeItem("voeux-affelnet:token");
    setGlobalState("auth", anonymous);
  }
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
