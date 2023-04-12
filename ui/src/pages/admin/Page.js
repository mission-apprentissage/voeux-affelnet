import React from "react";
import { Route, Routes } from "react-router-dom";

import { Page } from "../../common/components/layout/Page";
import { Academies } from "./academies/Academies";
import { Gestionnaires } from "./gestionnaires/Gestionnaires";
import Exports from "./exports/Exports";
import { Users } from "./users/Users";
import { Formateur } from "./users/Formateur";
import { Gestionnaire } from "./users/Gestionnaire";

function AdminPage() {
  return (
    <Routes>
      <Route
        path="/"
        exact
        element={
          <Page title="Administration">
            <Users />
            <Gestionnaires />
            <Exports />
            <Academies />
          </Page>
        }
      ></Route>

      <Route path="/gestionnaire/:siret" element={<Gestionnaire />}></Route>
      <Route path="/formateur/:uai" element={<Formateur />}></Route>
    </Routes>
  );
}

export default AdminPage;
