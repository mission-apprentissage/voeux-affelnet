import { Route, Routes } from "react-router-dom";

import { Etablissements } from "./Etablissements";
import { Etablissement } from "./Etablissement";

import { Alert } from "./Alert";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="" exact element={<Etablissements />}></Route>
      <Route path="etablissement/:identifiant" element={<Etablissement />}></Route>

      <Route path="alert" element={<Alert />}></Route>
    </Routes>
  );
}

export default AdminRoutes;
