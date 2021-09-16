import React from "react";
import { Page } from "tabler-react";
import Cfas from "./admin/Cfas";
import Academies from "./admin/Academies";
import Exports from "./admin/Exports";

function AdminPage() {
  return (
    <Page>
      <Page.Main>
        <Page.Content title="Administration">
          <Cfas />
          <Exports />
          <Academies />
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default AdminPage;
