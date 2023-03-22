import React from "react";
import { Box, Container, Heading } from "@chakra-ui/react";

import { setTitle } from "../../common/utils/pageUtils";

export const DonneesPersonnelles = () => {
  const title = "Données Personnelles";
  setTitle(title);

  return (
    <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
      <Container maxW="none">
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <Box mt={4}></Box>
      </Container>
    </Box>
  );
};

export default DonneesPersonnelles;
