import React from "react";
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
import useAuth from "../../hooks/useAuth";

const Header = () => {
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    setAuth();
    navigate("/login");
  };

  return (
    <>
      <Container maxW="full" borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 0, 4]}>
        <Container maxW="1280px" py={[0, 0, 2]} px={[0, 0, 4]}>
          <Flex alignItems="center" color="grey.800">
            {/* Logo */}
            <Link as={NavLink} to="/" p={[4, 4, 0]}>
              <Logo />
            </Link>

            <Box p={[1, 1, 6]} flex="1">
              <Heading as="h6" textStyle="h6" fontSize="20px">
                Transmission des Vœux Affelnet
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
                          ({auth.permissions?.isAdmin ? "admin" : auth.type})
                        </Text>
                      </Text>
                    </Box>
                  </Flex>
                </MenuButton>
                <MenuList>
                  <MenuItem as="a" href="/profil">
                    Profil
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={logout}>Déconnexion</MenuItem>
                </MenuList>
              </Menu>
            )}
            {/*
            <Box>
              <Text float={"right"} variant="slight" mb={4}>
                Connecté en tant que {auth?.sub}
              </Text>
              <br />
              <Button float={"right"} variant="pill" onClick={logout}>
                Déconnexion
              </Button>
            </Box> */}
          </Flex>
        </Container>
      </Container>
    </>
  );
};

export default Header;
