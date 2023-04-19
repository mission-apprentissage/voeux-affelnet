import React from "react";
import { Box, Container, Heading, Text, Link } from "@chakra-ui/react";
import { setTitle } from "../../common/utils/pageUtils";
import { NavLink } from "react-router-dom";
import { ExternalLinkLine } from "../../theme/components/icons";

export const MentionsLegales = () => {
  const title = "Mentions Légales";
  setTitle(title);

  return (
    <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
      <Container maxW="none">
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <Box pt={1} pb={16}>
          <Box>
            <Text>Dernière mise à jour le : 09/03/2023</Text>
            <Box mt={4}>
              <Heading as={"h3"} textStyle="h6" mb={2}>
                Éditeur du site
              </Heading>
              <Text>
                Le site de la Transmission des Vœux en apprentissage Affelnet est édité par La Mission
                interministérielle pour l'apprentissage, située à l'adresse:
                <br />
                Beta.gouv
                <br />
                20 avenue de Ségur
                <br />
                75007 PARIS
              </Text>
            </Box>
            <Box mt={4}>
              <Heading as={"h3"} textStyle="h6" mb={2}>
                Directeur de la publication
              </Heading>
              <Text>Monsieur Guillaume Houzel.</Text>
            </Box>
            <Box mt={4}>
              <Heading as={"h3"} textStyle="h6" mb={2}>
                Hébergement du site
              </Heading>
              <Text>
                Ce site est hébergé par OVH :
                <br />
                2 rue Kellermann
                <br />
                59100 Roubaix
                <br />
                Tél. : 09 72 10 10 07
              </Text>
            </Box>
            <Box mt={4}>
              <Heading as={"h3"} textStyle="h6" mb={2}>
                Amélioration et contact
              </Heading>
              <Text>
                L'équipe de la Transmission des Vœux reste à votre écoute et entière disposition, si vous souhaitez nous
                signaler le moindre défaut de conception.
                <br />
                Vous pouvez nous aider à améliorer l'accessibilité du site en nous signalant les problèmes éventuels que
                vous rencontrez :{" "}
                <Link as={NavLink} to={"/contact"} textDecoration={"underline"}>
                  Contactez-nous
                </Link>
                .
                <br />
                Vous pouvez également soumettre vos demandes de modification sur la plate-forme{" "}
                <Link
                  href={"https://github.com/mission-apprentissage/voeux-affelnet/issues"}
                  textDecoration={"underline"}
                  isExternal
                >
                  Github <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} />
                </Link>
                .
              </Text>
            </Box>
            <Box mt={4}>
              <Heading as={"h3"} textStyle="h6" mb={2}>
                Sécurité
              </Heading>
              <Text>
                Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs
                par un cadenas. Cette protection participe à la confidentialité des échanges.
                <br />
                En aucun cas les services associés au site ne seront à l’origine d’envoi de courriels pour demander la
                saisie d’informations personnelles.
              </Text>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MentionsLegales;