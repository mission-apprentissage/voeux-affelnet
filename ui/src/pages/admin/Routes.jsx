import { Route, Routes } from "react-router-dom";

import { Etablissements } from "./etablissements/Etablissements";
import { Etablissement } from "./etablissements/Etablissement";
import { Responsable } from "./etablissements/Responsable";
import { Responsables } from "./etablissements/Responsables";
import { Formateurs } from "./etablissements/Formateurs";
import { Formateur } from "./etablissements/Formateur";
import { Alert } from "./Alert";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="" exact element={<Etablissements />}></Route>
      <Route path="etablissement/:identifiant" element={<Etablissement />}></Route>

      <Route path="responsable/:siret_responsable" element={<Responsable />}></Route>
      <Route path="responsable/:siret_responsable/formateurs" element={<Formateurs />}></Route>
      <Route path="responsable/:siret_responsable/formateur/:siret_formateur" element={<Formateur />}></Route>
      <Route path="formateur/:siret_formateur" element={<Formateur />}></Route>
      <Route path="formateur/:siret_formateur/responsables" element={<Responsables />}></Route>

      <Route path="alert" element={<Alert />}></Route>
    </Routes>
  );
}

export default AdminRoutes;
