import { useCallback, useState, useEffect, useRef } from "react";
import { Redirect } from "react-router-dom";

import useAuth from "../common/hooks/useAuth";
import { _get } from "../common/httpClient";
import { USER_TYPE } from "../common/constants/UserType";

export const ProfilPage = () => {
  const [auth] = useAuth();
  const [self, setSelf] = useState(undefined);
  const mountedRef = useRef(false);

  const getSelf = useCallback(async () => {
    switch (auth.type) {
      case USER_TYPE.ETABLISSEMENT: {
        const response = await _get("/api/responsable");
        setSelf(response);
        break;
      }
      case USER_TYPE.DELEGUE: {
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
          [USER_TYPE.ETABLISSEMENT]: <Redirect to={"/responsable"} replace />,
          [USER_TYPE.DELEGUE]: <Redirect to={"/delegue"} replace />,
        }[self?.type]
      }
    </>
  );
};

export default ProfilPage;
