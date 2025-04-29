import { Box, Link, Text } from "@chakra-ui/react";
import { Page } from "../../common/components/layout/Page";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const Contact = () => {
  const title = "Contact";

  return (
    <>
      <Breadcrumb items={[{ label: title, url: "/contact" }]} />

      <Page title={title}>
        <Box mt={4}>
          <Text mb={4}>
            Développé par la mission interministérielle apprentissage, le service a été pérennisé et repris en 2023 par
            la Direction du numérique pour l'éducation (Direction générale de l'enseignement scolaire - Secrétariat
            général, Ministère de l’Éducation nationale, de l’Enseignement supérieur et de la Recherche), 61-65 rue
            Dutot, 75357 Paris Cedex 15
          </Text>

          <Text mb={4}>
            Une remarque, un avis, une suggestion d’amélioration ?{" "}
            <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
              Contactez-nous !
            </Link>
          </Text>
        </Box>
      </Page>
    </>
  );
};

export default Contact;
