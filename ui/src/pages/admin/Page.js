import React from "react";
import { Route, Routes } from "react-router-dom";

import { Page } from "../../common/components/layout/Page";
import { Users } from "./users/Users";
import { Gestionnaire } from "./users/Gestionnaire";
import { Formateurs } from "./users/Formateurs";
import { Formateur } from "./users/Formateur";

function AdminPage() {
  return (
    <Routes>
      <Route
        path="/"
        exact
        element={
          <Page title="Listes de candidats Affelnet : console de pilotage">
            <Users />
          </Page>
        }
      ></Route>

      <Route path="/gestionnaire/:siret" element={<Gestionnaire />}></Route>
      <Route path="/gestionnaire/:siret/formateurs" element={<Formateurs />}></Route>
      <Route path="/gestionnaire/:siret/formateur/:uai" element={<Formateur />}></Route>
      <Route path="/formateur/:uai" element={<Formateur />}></Route>
    </Routes>
  );
}

export default AdminPage;
