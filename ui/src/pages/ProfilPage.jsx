import React, { useCallback, useState, useEffect, useRef } from "react";
import { Redirect } from "react-router-dom";

import useAuth from "../common/hooks/useAuth";
import { _get } from "../common/httpClient";

export const ProfilPage = () => {
  const [auth] = useAuth();
  const [self, setSelf] = useState(undefined);
  const mountedRef = useRef(false);

  const getSelf = useCallback(async () => {
    switch (auth.type) {
      case "Gestionnaire": {
        const response = await _get("/api/gestionnaire");
        setSelf(response);
        break;
      }
      case "Formateur": {
        const response = await _get("/api/formateur");
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
          Gestionnaire: <Redirect to={"/gestionnaire"} replace />,
          Formateur: <Redirect to={"/formateur"} replace />,
        }[self?.type]
      }
    </>
  );
};

export default ProfilPage;
