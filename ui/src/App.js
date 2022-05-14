import React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Layout from "./pages/Layout";
import useAuth from "./common/hooks/useAuth";
import FichiersPage from "./pages/FichiersPage";
import ActivationPage from "./pages/ActivationPage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import PreviewEmail from "./pages/PreviewEmail";
import ConfirmationPage from "./pages/ConfirmationPage";
import StatsPage from "./pages/StatsPage";
import AdminPage from "./pages/AdminPage";

function PrivateRoute({ children, ...rest }) {
  const [auth] = useAuth();

  return (
    <Layout>
      <Route
        {...rest}
        render={() => {
          return auth.sub !== "anonymous" ? children : <Redirect to="/login" />;
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
            {auth && auth.permissions.isAdmin ? <AdminPage /> : <Redirect to="/fichiers" />}
          </PrivateRoute>
          <PrivateRoute exact path="/fichiers">
            <FichiersPage />
          </PrivateRoute>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/activation" component={ActivationPage} />
          <Route exact path="/confirmation" component={ConfirmationPage} />
          <Route exact path="/stats" component={StatsPage} />
          <Route exact path="/reset-password" component={ResetPasswordPage} />
          <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
          <Route exact path="/emails/:token/preview" component={PreviewEmail} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
