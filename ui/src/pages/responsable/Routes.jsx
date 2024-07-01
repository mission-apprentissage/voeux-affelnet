import { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";
import { _get } from "../../common/httpClient";
import { Formateur } from "./Formateur";
import { Formateurs } from "./Formateurs";
import { Responsable } from "./Responsable";

const ResponsableRoutes = () => {
  const [responsable, setResponsable] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const [delegues, setDelegues] = useState(undefined);
  const mounted = useRef(false);

  const getResponsable = useCallback(async () => {
    try {
      const response = await _get("/api/responsable");
      setResponsable(response);
    } catch (error) {
      setResponsable(undefined);
      throw Error;
    }
  }, [setResponsable]);

  // const getFormateurs = useCallback(async () => {
  //   try {
  //     const response = await _get("/api/responsable/formateurs");
  //     setFormateurs(response);
  //   } catch (error) {
  //     setFormateurs(undefined);
  //     throw Error;
  //   }
  // }, [setFormateurs]);

  // const getDelegues = useCallback(async () => {
  //   try {
  //     const response = await _get("/api/responsable/delegues");
  //     setDelegues(response);
  //   } catch (error) {
  //     setDelegues(undefined);
  //     throw Error;
  //   }
  // }, [setDelegues]);

  const reload = useCallback(async () => {
    await getResponsable();
    // await getFormateurs();
    // await getDelegues();
  }, [getResponsable /*, getFormateurs, getDelegues*/]);

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

  if (!responsable) {
    return;
  }

  // useEffect(() => {
  //   if (
  //     responsable?.relations.length === 1 &&
  //     responsable?.relations[0].etablissements_formateur.uai === responsable?.uai
  //   ) {
  //     navigate(`/responsable/formateurs/${responsable?.uai}`, { replace: true });
  //   }
  // }, [responsable, navigate]);

  return (
    <>
      <Routes>
        <Route exact path="" element={<Responsable responsable={responsable} callback={reload} />} />
        <Route exact path="formateurs" element={<Formateurs responsable={responsable} callback={reload} />} />
        <Route exact path="formateurs/:uai" element={<Formateur responsable={responsable} callback={reload} />} />
      </Routes>
    </>
  );
};

export default ResponsableRoutes;
