import React, { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";

import { _get } from "../../common/httpClient";
import { Formateur } from "./Formateur";

const FormateurRoutes = () => {
  const [formateur, setFormateur] = useState(undefined);
  const [gestionnaires, setGestionnaires] = useState(undefined);
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

  const getGestionnaires = useCallback(async () => {
    try {
      const response = await _get("/api/formateur/gestionnaires");
      setGestionnaires(response);
    } catch (error) {
      setGestionnaires(undefined);
      throw Error;
    }
  }, [setGestionnaires]);

  const reload = useCallback(async () => {
    await getFormateur();
    await getGestionnaires();
  }, [getFormateur, getGestionnaires]);

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
          path="/"
          element={<Formateur formateur={formateur} gestionnaires={gestionnaires} callback={reload} />}
        />

        {/* <Route
          exact
          path="/gestionnaires"
          element={<Gestionnaires formateur={formateur} gestionnaires={gestionnaires} callback={reload} />}
        />
        <Route
          exact
          path="/gestionnaires/:uai"
          element={<Formateur formateur={formateur} gestionnaires={gestionnaires} callback={reload} />}
        /> */}
      </Routes>
    </>
  );
};

export default FormateurRoutes;
