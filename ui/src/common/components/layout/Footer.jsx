import { Box, Container, Flex, Link, List, ListItem, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { ExternalLinkLine } from "../../../theme/components/icons";

const Footer = () => {
  return (
    <Box borderTop="1px solid" borderColor="bluefrance" color="#1E1E1E" fontSize="zeta" w="full">
      <Container maxW="1280px">
        <Flex flexDirection={["column", "column", "row"]}>
          <Link as={NavLink} to="/" py={4} w={["100%", "100%", "50%"]}>
            <Logo size={"xl"} />
          </Link>
          <Box alignSelf="center" flex="1">
            <Text>
              Développé par la{" "}
              <Link
                href={"https://beta.gouv.fr/startups/?incubateur=mission-apprentissage"}
                textDecoration={"underline"}
                isExternal
              >
                Mission interministérielle pour l'apprentissage
              </Link>
              , le service a été pérennisé et repris en 2023 par la Direction du numérique pour l'éducation. Il est
              alimenté par les candidatures exprimées sur le service en ligne "Choisir son orientation" ainsi que par
              les données issues du catalogue national des formations en apprentissage.
            </Text>
            <br />
            <List textStyle="sm" fontWeight="700" flexDirection={"row"} flexWrap={"wrap"} mb={[3, 3, 0]} display="flex">
              <ListItem>
                <Link href="https://beta.gouv.fr/startups/?incubateur=mission-apprentissage" mr={4} isExternal>
                  beta.gouv.fr
                </Link>
              </ListItem>

              <ListItem>
                <Link href="https://affectation3e.phm.education.gouv.fr/pna-public/" mr={4} isExternal>
                  service en ligne "Choisir son orientation"
                </Link>
              </ListItem>

              <ListItem>
                <Link href="https://catalogue-apprentissage.intercariforef.org/" mr={4} isExternal>
                  catalogue apprentissage
                </Link>
              </ListItem>
            </List>
          </Box>
        </Flex>
      </Container>
      <Box borderTop="1px solid" borderColor="#CECECE" color="#6A6A6A">
        <Container maxW="6xl" py={[3, 3, 5]}>
          <Flex flexDirection={["column", "column", "row"]}>
            <List
              textStyle="xs"
              flexDirection={"row"}
              flexWrap={"wrap"}
              display="flex"
              flex="1"
              css={{ "li:not(:last-child):after": { content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" } }}
            >
              {/* <ListItem>
                <Link href={`${process.env.PUBLIC_URL}/sitemap.xml`}>Plan du site</Link>
              </ListItem> */}
              <ListItem>
                <Link as={NavLink} to={"/accessibilite"}>
                  Accessibilité : Non conforme
                </Link>
              </ListItem>
              <ListItem>
                <Link as={NavLink} to={"/mentions-legales"}>
                  Mentions légales
                </Link>
              </ListItem>
              {/*<ListItem>*/}
              {/*  <Link as={NavLink} to={"/donnees-personnelles"}>*/}
              {/*    Données personnelles*/}
              {/*  </Link>*/}
              {/*</ListItem>*/}
              <ListItem>
                <Link as={NavLink} to={"/cookies"}>
                  Gestion des cookies
                </Link>
              </ListItem>

              {/* <ListItem>
                <Link href="https://mission-apprentissage.gitbook.io/" isExternal>
                  Documentation
                </Link>
              </ListItem> */}
              <ListItem>
                <Link href="https://github.com/mission-apprentissage/voeux-affelnet" isExternal>
                  Code source
                </Link>
              </ListItem>
              <ListItem>
                <Link as={NavLink} to={"/stats"}>
                  Statistiques
                </Link>
              </ListItem>
              <ListItem>
                <Link as={NavLink} to={"/contact"}>
                  Contact
                </Link>
              </ListItem>
            </List>
            <Text textStyle="xs" mt={[2, 2, 0]}>
              © République française 2025
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
