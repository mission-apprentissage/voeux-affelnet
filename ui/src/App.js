import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import Layout from "./common/components/layout/Layout";
import useAuth from "./common/hooks/useAuth";
import { getUserType } from "./common/utils/getUserType";
import { isAcademie, isAdmin } from "./common/utils/aclUtils";
import { USER_TYPE } from "./common/constants/UserType";

const ForgottenPasswordPage = lazy(() => import("./pages/password/ForgottenPasswordPage"));
const ActivationPage = lazy(() => import("./pages/ActivationPage"));
const PreviewEmail = lazy(() => import("./pages/PreviewEmail"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const ReceptionVoeuxPage = lazy(() => import("./pages/ReceptionVoeuxPage"));

const ResponsableRoutes = lazy(() => import("./pages/responsable/Routes"));
// const FormateurRoutes = lazy(() => import("./pages/formateur/Routes"));
const DelegueRoutes = lazy(() => import("./pages/delegue/Routes"));
const AdminRoutes = lazy(() => import("./pages/admin/Routes"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const LogoutPage = lazy(() => import("./pages/LogoutPage"));
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
  const [searchParams] = useSearchParams();
  const isNotAllowed = allowed && !allowed.map((v) => v.toLowerCase()).includes(type);

  if (!auth || auth.sub === "anonymous" || isNotAllowed) {
    const previousPath = window.location.pathname + window.location.search;

    return (
      <Navigate
        to={`/login?actionToken=${searchParams.get("actionToken")}&redirect=${encodeURIComponent(previousPath)}`}
      />
    );
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  // TO FIX
  const [auth] = useAuth();

  const getDefaultRedirection = () => {
    switch (true) {
      case isAdmin(auth) || isAcademie(auth):
        return "admin";
      case USER_TYPE.ETABLISSEMENT:
        return "responsable";
      case USER_TYPE.DELEGUE:
        return "delegue";

      default:
        return getUserType(auth);
    }
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
                <RequireAuth allowed={[USER_TYPE.ADMIN, USER_TYPE.ACADEMIE]}>
                  <AdminRoutes />
                </RequireAuth>
              </Suspense>
            }
          />
          <Route
            path="/responsable/*"
            element={
              <Suspense>
                <RequireAuth allowed={[USER_TYPE.ETABLISSEMENT]}>
                  <ResponsableRoutes />
                </RequireAuth>
              </Suspense>
            }
          />
          <Route
            path="/etablissement/*"
            element={
              <Suspense>
                <RequireAuth allowed={[USER_TYPE.ETABLISSEMENT]}>
                  <ResponsableRoutes />
                </RequireAuth>
              </Suspense>
            }
          />

          <Route
            path="/delegue/*"
            element={
              <Suspense>
                <RequireAuth allowed={[USER_TYPE.DELEGUE]}>
                  <DelegueRoutes />
                </RequireAuth>
              </Suspense>
            }
          />

          <Route
            exact
            path="/profil"
            element={
              <Suspense>
                <RequireAuth allowed={[USER_TYPE.ETABLISSEMENT, USER_TYPE.DELEGUE]}>
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
            path="/logout"
            element={
              <Suspense>
                <LogoutPage />
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
