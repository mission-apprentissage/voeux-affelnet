import { NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Heading,
  Link,
  Button,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuDivider,
  MenuItem,
} from "@chakra-ui/react";
import { Logo } from "./Logo";
import { AccountFill, LockFill } from "../../../theme/components/icons";
import { AlertMessage } from "./AlertMessage";

import useAuth from "../../hooks/useAuth";
import { isAdmin } from "../../utils/aclUtils";

const Header = () => {
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    setAuth();
    navigate("/login");
  };

  return (
    <>
      <AlertMessage />

      <Container maxW="full" borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 0, 4]}>
        <Container maxW="1280px" py={[0, 0, 2]} px={[0, 0, 4]}>
          <Flex alignItems="center" color="grey.800">
            {/* Logo */}
            <Link as={NavLink} to="/" p={[4, 4, 0]}>
              <Logo />
            </Link>

            <Box p={[1, 1, 6]} flex="1">
              <Heading as="h6" textStyle="h6" fontSize="20px">
                Transmission des listes de candidats 2025
              </Heading>
            </Box>

            {auth?.sub === "anonymous" && (
              <Box>
                <Link as={NavLink} to="/login" variant="pill">
                  <LockFill boxSize={3} mr={2} />
                  Connexion
                </Link>
              </Box>
            )}
            {auth?.sub !== "anonymous" && (
              <Menu placement="bottom">
                <MenuButton as={Button} variant="pill" aria-label={`compte de ${auth.sub}`}>
                  <Flex>
                    <AccountFill color={"bluefrance"} mt="0.3rem" boxSize={4} />
                    <Box display={["none", "none", "block"]} ml={2}>
                      <Text color="bluefrance" textStyle="sm">
                        {auth.sub}{" "}
                        <Text color="grey.600" as="span">
                          ({auth.type})
                        </Text>
                      </Text>
                    </Box>
                  </Flex>
                </MenuButton>
                <MenuList>
                  {isAdmin(auth) && (
                    <>
                      <MenuItem as={NavLink} to="/admin/alert">
                        Gestion des messages d'alerte
                      </MenuItem>
                      <MenuDivider />
                    </>
                  )}
                  <MenuItem onClick={logout}>Déconnexion</MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>
        </Container>
      </Container>
    </>
  );
};

export default Header;
