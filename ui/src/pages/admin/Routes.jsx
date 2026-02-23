import { Route, Routes } from "react-router-dom";

import { Users } from "./Users";
import { Etablissements } from "./Etablissements";
import { Etablissement } from "./Etablissement";

import { Alert } from "./Alert";
import { RequireAuth } from "../../common/components/layout/RequireAuth";
import { USER_TYPE } from "../../common/constants/UserType";
import { Config } from "./Config";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="" exact element={<Etablissements />}></Route>
      <Route path="etablissement/:identifiant" element={<Etablissement />}></Route>

      <Route
        path="alert"
        element={
          <RequireAuth allowed={[USER_TYPE.ADMIN]}>
            <Alert />
          </RequireAuth>
        }
      ></Route>

      <Route
        path="config"
        element={
          <RequireAuth allowed={[USER_TYPE.ADMIN]}>
            <Config />
          </RequireAuth>
        }
      ></Route>

      <Route
        path="users"
        element={
          <RequireAuth allowed={[USER_TYPE.ADMIN]}>
            <Users />
          </RequireAuth>
        }
      ></Route>
    </Routes>
  );
}

export default AdminRoutes;
