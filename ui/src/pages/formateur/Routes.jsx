import { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";

import { _get } from "../../common/httpClient";
import { Formateur } from "./Formateur";

const FormateurRoutes = () => {
  const [formateur, setFormateur] = useState(undefined);
  const [responsables, setResponsables] = useState(undefined);
  const mounted = useRef(false);

  const getFormateur = useCallback(async () => {
    try {
      const response = await _get("/api/formateur");
      setFormateur(response);
    } catch (error) {
      setFormateur(undefined);
      throw Error;
    }
  }, [setFormateur]);

  const getResponsables = useCallback(async () => {
    try {
      const response = await _get("/api/formateur/responsables");
      setResponsables(response);
    } catch (error) {
      setResponsables(undefined);
      throw Error;
    }
  }, [setResponsables]);

  const reload = useCallback(async () => {
    await getFormateur();
    await getResponsables();
  }, [getFormateur, getResponsables]);

  useEffect(() => {
    const run = async () => {
      if (!mounted.current) {
        await reload();
        mounted.current = true;
      }
    };
    run();

    return () => {
      mounted.current = false;
    };
  }, [reload]);

  if (!formateur) {
    return;
  }

  return (
    <>
      <Routes>
        <Route
          exact
          path=""
          element={<Formateur formateur={formateur} responsables={responsables} callback={reload} />}
        />

        {/* <Route
          exact
          path="responsables"
          element={<Responsables formateur={formateur} responsables={responsables} callback={reload} />}
        />
        <Route
          exact
          path="responsables/:uai"
          element={<Formateur formateur={formateur} responsables={responsables} callback={reload} />}
        /> */}
      </Routes>
    </>
  );
};

export default FormateurRoutes;
