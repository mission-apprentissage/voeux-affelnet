import { Route, Routes } from "react-router-dom";

import { Page } from "../../common/components/layout/Page";
import { Users } from "./users/Users";
import { Gestionnaire } from "./users/Gestionnaire";
import { Gestionnaires } from "./users/Gestionnaires";
import { Formateurs } from "./users/Formateurs";
import { Formateur } from "./users/Formateur";
import { Alert } from "./Alert";

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path=""
        exact
        element={
          <Page title="Listes de candidats Affelnet : console de pilotage">
            <Users />
          </Page>
        }
      ></Route>

      <Route path="alert" element={<Alert />}></Route>
      <Route path="gestionnaire/:siret" element={<Gestionnaire />}></Route>
      <Route path="gestionnaire/:siret/formateurs" element={<Formateurs />}></Route>
      <Route path="gestionnaire/:siret/formateur/:uai" element={<Formateur />}></Route>
      <Route path="formateur/:uai" element={<Formateur />}></Route>
      <Route path="formateur/:uai/gestionnaires" element={<Gestionnaires />}></Route>
    </Routes>
  );
}

export default AdminRoutes;
