import { Route, Routes } from "react-router-dom";

import { Page } from "../../common/components/layout/Page";
import { Etablissements } from "./etablissements/Etablissements";
// import { Etablissement } from "./etablissements/Etablissement";
import { Responsable } from "./etablissements/Responsable";
import { Responsables } from "./etablissements/Responsables";
import { Formateurs } from "./etablissements/Formateurs";
import { Formateur } from "./etablissements/Formateur";
import { Alert } from "./Alert";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="" exact element={<Etablissements />}></Route>

      <Route path="alert" element={<Alert />}></Route>
      {/* <Route path="etablissement/:identifiant" element={<Etablissement />}></Route> */}
      <Route path="responsable/:siret" element={<Responsable />}></Route>
      <Route path="responsable/:siret/formateurs" element={<Formateurs />}></Route>
      <Route path="responsable/:siret/formateur/:uai" element={<Formateur />}></Route>
      <Route path="formateur/:uai" element={<Formateur />}></Route>
      <Route path="formateur/:uai/responsables" element={<Responsables />}></Route>
    </Routes>
  );
}

export default AdminRoutes;
