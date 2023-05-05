import React from "react";
import { Box, Heading, Text, Link } from "@chakra-ui/react";
import { setTitle } from "../../common/utils/pageUtils";
// import { ExternalLinkLine } from "../../theme/components/icons";
import { Page } from "../../common/components/layout/Page";

export const MentionsLegales = () => {
  const title = "Mentions Légales";
  setTitle(title);

  return (
    <Page title={title}>
      <Box>
        <Text mb={8}>Dernière mise à jour le : 09/03/2023</Text>

        <Text mb={8}>
          <strong>
            La conception éditoriale, le suivi de l'exactitude et la pertinence des informations diffusées, la
            maintenance technique et les mises à jour du site sont assurés par la Direction du numérique pour
            l’éducation, sous-direction SN, bureau SN2.
          </strong>
        </Text>

        <Box mb={8}>
          <Heading as={"h3"} size="md" mb={4}>
            Éditeur du site
          </Heading>
          <Text>
            Direction du numérique pour l'éducation
            <br />
            Direction générale de l'enseignement scolaire - Secrétariat général,
            <br />
            Ministères Éducation Jeunesse Sports Enseignement Supérieur Recherche
            <br />
            61-65 rue Dutot, 75357 Paris Cedex 15
          </Text>
        </Box>
        {/* TODO: */}
        {/* <Box mb={8}>
          <Heading as={"h3"} size="md" mb={4}>
            Directeur de la publication
          </Heading>
          <Text>Monsieur Guillaume Houzel.</Text>
        </Box> */}
        <Box mb={8}>
          <Heading as={"h3"} size="md" mb={4}>
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
        <Box mb={8}>
          <Heading as={"h3"} size="md" mb={4}>
            Amélioration et contact
          </Heading>
          <Text>
            L'équipe de la diffusion des listes de candidats reste à votre disposition si vous souhaitez nous signaler
            le moindre défaut de conception.
            <br />
            Vous pouvez nous aider à améliorer l'accessibilité du site en nous signalant les problèmes éventuels que
            vous rencontrez :{" "}
            <Link variant="action" href={"/contact"}>
              Contactez-nous
            </Link>
            .
            {/* <br />
            Vous pouvez également soumettre vos demandes de modification sur la plate-forme{" "}
            <Link href={"https://github.com/mission-apprentissage/voeux-affelnet/issues"} variant="action" isExternal>
              Github <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} />
            </Link>
            . */}
          </Text>
        </Box>
        <Box mb={8}>
          <Heading as={"h3"} size="md" mb={4}>
            Sécurité
          </Heading>
          <Text>
            Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs par
            un cadenas. Cette protection participe à la confidentialité des échanges.
            <br />
            En aucun cas les services associés au site ne seront à l’origine d’envoi de courriels pour demander la
            saisie d’informations personnelles.
          </Text>
        </Box>
      </Box>
    </Page>
  );
};

export default MentionsLegales;
