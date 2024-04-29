import { useCallback, useState, useEffect, useRef } from "react";
import { Redirect } from "react-router-dom";

import useAuth from "../common/hooks/useAuth";
import { _get } from "../common/httpClient";
import { UserType } from "../common/constants/UserType";

export const ProfilPage = () => {
  const [auth] = useAuth();
  const [self, setSelf] = useState(undefined);
  const mountedRef = useRef(false);

  const getSelf = useCallback(async () => {
    switch (auth.type) {
      case UserType.RESPONSABLE: {
        const response = await _get("/api/responsable");
        setSelf(response);
        break;
      }
      case UserType.FORMATEUR: {
        const response = await _get("/api/formateur");
        setSelf(response);
        break;
      }
      case UserType.DELEGUE: {
        const response = await _get("/api/delegue");
        setSelf(response);
        break;
      }
      default: {
        break;
      }
    }
  }, [auth]);

  useEffect(() => {
    const run = () => {
      if (!mountedRef.current) {
        mountedRef.current = true;
        getSelf();
      }
    };
    run();
  }, [getSelf]);

  return (
    <>
      {
        {
          [UserType.RESPONSABLE]: <Redirect to={"/responsable"} replace />,
          [UserType.FORMATEUR]: <Redirect to={"/formateur"} replace />,
          [UserType.DELEGUE]: <Redirect to={"/delegue"} replace />,
        }[self?.type]
      }
    </>
  );
};

export default ProfilPage;
