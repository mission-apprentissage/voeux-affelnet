import React from "react";
import { Box, Link, Text } from "@chakra-ui/react";
import { Page } from "../../common/components/layout/Page";

export const Contact = () => {
  const title = "Contact";

  return (
    <Page title={title}>
      <Box mt={4}>
        <Text mb={4}>
          Développé par la mission interministérielle apprentissage, le service a été pérennisé et repris en 2023 par la
          Direction du numérique pour l'éducation (Direction générale de l'enseignement scolaire - Secrétariat général,
          Ministères Éducation Jeunesse Sports Enseignement Supérieur Recherche), 61-65 rue Dutot, 75357 Paris Cedex 15
        </Text>

        <Text mb={4}>
          Une remarque, un avis, une suggestion d’amélioration ?{" "}
          <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
            Contactez-nous !
          </Link>
        </Text>
      </Box>
    </Page>
  );
};

export default Contact;
