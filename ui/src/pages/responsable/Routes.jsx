import { Route, Routes } from "react-router-dom";
import Responsable from "./Responsable";

const ResponsableRoutes = () => {
  return (
    <>
      <Routes>
        <Route exact path="" element={<Responsable />} />
      </Routes>
    </>
  );
};

export default ResponsableRoutes;
