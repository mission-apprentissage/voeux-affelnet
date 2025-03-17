import { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";

import { _get } from "../../common/httpClient";

import { Delegue } from "./Delegue";
// import { Relations } from "./Relations";
// import { Relation } from "./Relation";

const DelegueRoutes = () => {
  const [delegue, setDelegue] = useState(undefined);
  const mounted = useRef(false);

  const getDelegue = useCallback(async () => {
    try {
      const response = await _get("/api/delegue");
      setDelegue(response);
    } catch (error) {
      setDelegue(undefined);
      throw Error;
    }
  }, [setDelegue]);

  const reload = useCallback(async () => {
    await getDelegue();
  }, [getDelegue]);

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

  if (!delegue) {
    return;
  }

  return (
    <>
      <Routes>
        <Route exact path="" element={<Delegue delegue={delegue} callback={reload} />} />
      </Routes>
    </>
  );
};

export default DelegueRoutes;
