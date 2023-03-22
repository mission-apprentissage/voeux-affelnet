import React from "react";
import { Page } from "../common/components/layout/Page";
import Academies from "./admin/academies/Academies";
import Gestionnaires from "./admin/gestionnaires/Gestionnaires";
import Exports from "./admin/exports/Exports";
import Gestionnaire from "./admin/gestionnaires/Gestionnaire";
import { Route, Routes } from "react-router-dom";

function AdminPage() {
  return (
    <Routes>
      <Route
        path="/"
        exact
        element={
          <Page title="Administration">
            <Gestionnaires />
            <Exports />
            <Academies />
          </Page>
        }
      ></Route>

      <Route path="cfas/:siret" element={<Gestionnaire />}></Route>
    </Routes>
  );
}

export default AdminPage;
