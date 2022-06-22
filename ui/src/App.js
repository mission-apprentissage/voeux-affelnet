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
import RelationPage from "./pages/RelationPage";
import CsaioPage from "./pages/CsaioPage.js";

function PrivateRoute({ children, ...rest }) {
  const [auth] = useAuth();

  return (
    <Layout>
      <Route {...rest} render={() => (auth.sub !== "anonymous" ? children : <Redirect to="/login" />)} />
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
            {auth.permissions.isAdmin ? <AdminPage /> : <Redirect to={`/${auth.type?.toLowerCase()}`} />}
          </PrivateRoute>
          <PrivateRoute exact path="/cfa">
            <CfaPage />
          </PrivateRoute>
          <PrivateRoute exact path="/csaio">
            <CsaioPage />
          </PrivateRoute>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/activation" component={ActivationPage} />
          <Route exact path="/confirmation" component={ConfirmationPage} />
          <Route exact path="/stats" component={StatsPage} />
          <Route exact path="/reception-voeux" component={RelationPage} />
          <Route exact path="/reset-password" component={ResetPasswordPage} />
          <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
          <Route exact path="/emails/:token/preview" component={PreviewEmail} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
