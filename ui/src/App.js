import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./common/components/layout/Layout";
import useAuth from "./common/hooks/useAuth";
import { getUserType } from "./common/utils/getUserType.js";

const ForgottenPasswordPage = lazy(() => import("./pages/password/ForgottenPasswordPage"));
const ActivationPage = lazy(() => import("./pages/ActivationPage"));
const PreviewEmail = lazy(() => import("./pages/PreviewEmail"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const ReceptionVoeuxPage = lazy(() => import("./pages/ReceptionVoeuxPage"));

const GestionnaireRoutes = lazy(() => import("./pages/gestionnaire/Routes"));
const FormateurRoutes = lazy(() => import("./pages/formateur/Routes"));
const AdminRoutes = lazy(() => import("./pages/admin/Routes"));
const CsaioPage = lazy(() => import("./pages/CsaioPage.js"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/password/ResetPasswordPage"));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage"));
const AnomaliePage = lazy(() => import("./pages/AnomaliePage"));
const YmagPage = lazy(() => import("./pages/YmagPage"));

const Contact = lazy(() => import("./pages/legal/Contact"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
const DonneesPersonnelles = lazy(() => import("./pages/legal/DonneesPersonnelles"));
const MentionsLegales = lazy(() => import("./pages/legal/MentionsLegales"));
const Accessibilite = lazy(() => import("./pages/legal/Accessibilite"));

const RequireAuth = ({ children, allowed }) => {
  const [auth] = useAuth();
  const type = getUserType(auth);
  const isNotAllowed = allowed && !allowed.includes(type);

  if (!auth || auth.sub === "anonymous" || isNotAllowed) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  const [auth] = useAuth();

  const getDefaultRedirection = () => {
    return auth.type === "Gestionnaire" ? "gestionnaire/formateurs" : getUserType(auth);
  };

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route
            exact
            path="/"
            element={
              <Suspense>
                <RequireAuth>
                  <Navigate to={`/${getDefaultRedirection()}`} />
                </RequireAuth>
              </Suspense>
            }
          />

          <Route
            path="/admin/*"
            element={
              <Suspense>
                <RequireAuth allowed={["admin"]}>
                  <AdminRoutes />
                </RequireAuth>
              </Suspense>
            }
          />
          <Route
            path="/gestionnaire/*"
            element={
              <Suspense>
                <RequireAuth allowed={["gestionnaire"]}>
                  <GestionnaireRoutes />
                </RequireAuth>
              </Suspense>
            }
          />

          <Route
            path="/formateur/*"
            element={
              <Suspense>
                <RequireAuth allowed={["formateur"]}>
                  <FormateurRoutes />
                </RequireAuth>
              </Suspense>
            }
          />
          <Route
            exact
            path="/csaio"
            element={
              <Suspense>
                <RequireAuth allowed={["csaio"]}>
                  <CsaioPage />
                </RequireAuth>
              </Suspense>
            }
          />

          <Route
            exact
            path="/profil"
            element={
              <Suspense>
                <RequireAuth allowed={["gestionnaire", "formateur"]}>
                  <Navigate to={`/${getUserType(auth)}`} />;
                </RequireAuth>
              </Suspense>
            }
          />

          <Route
            exact
            path="/stats"
            element={
              <Suspense>
                <Layout>
                  <StatsPage />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/support"
            element={
              <Suspense>
                <Layout>
                  <AnomaliePage />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/ymag-ou-igesti"
            element={
              <Suspense>
                <Layout>
                  <YmagPage />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/reception-voeux"
            element={
              <Suspense>
                <Layout>
                  <ReceptionVoeuxPage />
                </Layout>
              </Suspense>
            }
          />

          <Route
            exact
            path="/login"
            element={
              <Suspense>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            exact
            path="/activation"
            element={
              <Suspense>
                <ActivationPage />
              </Suspense>
            }
          />
          <Route
            exact
            path="/confirmation"
            element={
              <Suspense>
                <ConfirmationPage />
              </Suspense>
            }
          />
          <Route
            exact
            path="/reset-password"
            element={
              <Suspense>
                <ResetPasswordPage />
              </Suspense>
            }
          />
          <Route
            exact
            path="/forgotten-password"
            element={
              <Suspense>
                <ForgottenPasswordPage />
              </Suspense>
            }
          />
          <Route
            exact
            path="/emails/:token/preview"
            element={
              <Suspense>
                <PreviewEmail />
              </Suspense>
            }
          />

          <Route
            exact
            path="/contact"
            element={
              <Suspense>
                <Layout>
                  <Contact />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/cookies"
            element={
              <Suspense>
                <Layout>
                  <Cookies />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/donnees-personnelles"
            element={
              <Suspense>
                <Layout>
                  <DonneesPersonnelles />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/mentions-legales"
            element={
              <Suspense>
                <Layout>
                  <MentionsLegales />
                </Layout>
              </Suspense>
            }
          />
          <Route
            exact
            path="/accessibilite"
            element={
              <Suspense>
                <Layout>
                  <Accessibilite />
                </Layout>
              </Suspense>
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
