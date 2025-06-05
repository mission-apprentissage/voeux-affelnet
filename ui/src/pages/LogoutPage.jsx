import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Box, Center, Grid, Heading, Link } from "@chakra-ui/react";

import useAuth from "../common/hooks/useAuth";
import { AlertMessage } from "../common/components/layout/AlertMessage";

function LogoutPage() {
  const [, setAuth] = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      setAuth();

      // wait 5 seconds before redirecting
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    };

    run();
  }, [setAuth, navigate]);

  const title = "Déconnexion";

  return (
    <Grid height="100vh" gridTemplateAreas={`'top' 'bottom'`} gridTemplateRows="max-content">
      <AlertMessage gridArea="top" />

      <Center gridArea="bottom" verticalAlign="center" flexDirection={"column"}>
        <Box width={["auto", "48rem"]}>
          <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
            {title}
          </Heading>

          <Box mb={8}>
            Vous avez été déconnecté de l'application. Vous allez être redirigé vers la page de connexion
            automatiquement.
          </Box>

          <Box mb={8}>
            Si la redirection ne se fait pas automatiquement, veuillez suivre sur le lien ci-dessous :
            <br />
            <Link as={NavLink} variant="action" to={`/login`}>
              Page de connexion
            </Link>
          </Box>
        </Box>
      </Center>
    </Grid>
  );
}

export default LogoutPage;
