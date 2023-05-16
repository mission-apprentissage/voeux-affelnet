import React, { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";
import { _get } from "../../common/httpClient";
import { Formateur } from "./Formateur";
import { Formateurs } from "./Formateurs";
import { Gestionnaire } from "./Gestionnaire";

const GestionnaireRoutes = () => {
  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const mounted = useRef(false);

  const getGestionnaire = useCallback(async () => {
    try {
      const response = await _get("/api/gestionnaire");
      setGestionnaire(response);
    } catch (error) {
      setGestionnaire(undefined);
      throw Error;
    }
  }, [setGestionnaire]);

  const getFormateurs = useCallback(async () => {
    try {
      const response = await _get("/api/gestionnaire/formateurs");
      setFormateurs(response);
    } catch (error) {
      setFormateurs(undefined);
      throw Error;
    }
  }, [setFormateurs]);

  const reload = useCallback(async () => {
    await getGestionnaire();
    await getFormateurs();
  }, [getGestionnaire, getFormateurs]);

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

  if (!gestionnaire) {
    return;
  }

  return (
    <>
      <Routes>
        <Route
          exact
          path="/"
          element={<Gestionnaire gestionnaire={gestionnaire} formateurs={formateurs} callback={reload} />}
        />
        <Route
          exact
          path="/formateurs"
          element={<Formateurs gestionnaire={gestionnaire} formateurs={formateurs} callback={reload} />}
        />
        <Route
          exact
          path="/formateurs/:uai"
          element={<Formateur gestionnaire={gestionnaire} formateurs={formateurs} callback={reload} />}
        />
      </Routes>
    </>
  );
};

export default GestionnaireRoutes;
