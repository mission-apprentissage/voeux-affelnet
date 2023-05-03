import React from "react";
import { Box, Container, Heading, Link, Text } from "@chakra-ui/react";
import { setTitle } from "../../common/utils/pageUtils";

export const Contact = () => {
  const title = "Contact";
  setTitle(title);

  return (
    <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
      <Container maxW="none">
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <Box mt={4}>
          <Text>
            Une remarque, un avis, une suggestion d’amélioration ?{" "}
            <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
              Contactez-nous !
            </Link>
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
