import React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Layout from "./pages/Layout";
import useAuth from "./common/hooks/useAuth";
import CfaPage from "./pages/CfaPage.js";
import ActivationPage from "./pages/ActivationPage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import PreviewEmail from "./pages/PreviewEmail";
import ConfirmationPage from "./pages/ConfirmationPage";
import StatsPage from "./pages/StatsPage";
import AdminPage from "./pages/AdminPage";
import ReceptionVoeuxPage from "./pages/ReceptionVoeuxPage";
import CsaioPage from "./pages/CsaioPage.js";
import { getUserType } from "./common/utils/getUserType.js";

function PrivateRoute({ children, allowed, ...rest }) {
  const [auth] = useAuth();

  return (
    <Layout>
      <Route
        {...rest}
        render={() => {
          const type = getUserType(auth);
          const isNotAllowed = allowed && !allowed.includes(type);

          if (auth.sub === "anonymous" || isNotAllowed) {
            return <Redirect to="/login" />;
          }

          return children;
        }}
      />
    </Layout>
  );
}

function App() {
  const [auth] = useAuth();

  return (
    <div className="App">
      <Router>
        <Switch>
          <PrivateRoute exact path="/">
            <Redirect to={`/${getUserType(auth)}`} />
          </PrivateRoute>
          <PrivateRoute exact path="/admin" allowed={["admin"]}>
            <AdminPage />
          </PrivateRoute>
          <PrivateRoute exact path="/cfa" allowed={["cfa"]}>
            <CfaPage />
          </PrivateRoute>
          <PrivateRoute exact path="/csaio" allowed={["csaio"]}>
            <CsaioPage />
          </PrivateRoute>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/activation" component={ActivationPage} />
          <Route exact path="/confirmation" component={ConfirmationPage} />
          <Route exact path="/stats" component={StatsPage} />
          <Route exact path="/reception-voeux" component={ReceptionVoeuxPage} />
          <Route exact path="/reset-password" component={ResetPasswordPage} />
          <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
          <Route exact path="/emails/:token/preview" component={PreviewEmail} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
