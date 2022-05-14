import React from "react";
import { Site, Nav } from "tabler-react";
import useAuth from "../common/hooks/useAuth";
import { useHistory } from "react-router-dom";

function Layout(props) {
  const [auth, setAuth] = useAuth();
  const history = useHistory();
  const logout = () => {
    setAuth(null);
    history.push("/login");
  };

  return (
    <Site>
      <Site.Header>
        Mission apprentissage
        <div className="d-flex order-lg-2 ml-auto">
          <Nav.Item hasSubNav value={auth.sub} icon="user">
            <a className="dropdown-item" onClick={logout}>
              Déconnexion
            </a>
          </Nav.Item>
        </div>
      </Site.Header>
      {props.children}
    </Site>
  );
}

export default Layout;
