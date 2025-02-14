import { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";
import { _get } from "../../common/httpClient";
import { Formateur } from "./Formateur";
import { Formateurs } from "./Formateurs";
import { Responsable } from "./Responsable";

const ResponsableRoutes = () => {
  const [responsable, setResponsable] = useState(undefined);
  const mounted = useRef(false);

  const getResponsable = useCallback(async () => {
    try {
      const response = await _get("/api/responsable");
      console.log(response);
      setResponsable(response);
    } catch (error) {
      console.log(error);
      setResponsable(undefined);
      throw Error;
    }
  }, [setResponsable]);

  const reload = useCallback(async () => {
    await getResponsable();
  }, [getResponsable]);

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
  //     responsable?.relations[0].etablissements_formateur.siret === responsable?.siret
  //   ) {
  //     navigate(`/responsable/formateurs/${responsable?.siret}`, { replace: true });
  //   }
  // }, [responsable, navigate]);

  // if (!responsable.is_responsable) {
  //   return "Vous n'êtes pas autorisé à accéder à cette page";
  // }

  return (
    <>
      <Routes>
        <Route exact path="" element={<Responsable responsable={responsable} callback={reload} />} />
        <Route exact path="formateurs" element={<Formateurs responsable={responsable} callback={reload} />} />
        <Route exact path="formateurs/:siret" element={<Formateur responsable={responsable} callback={reload} />} />
      </Routes>
    </>
  );
};

export default ResponsableRoutes;
