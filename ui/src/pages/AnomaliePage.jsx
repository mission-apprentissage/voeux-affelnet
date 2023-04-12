import React from "react";
import { Box, Container, Heading } from "@chakra-ui/react";
import { setTitle } from "../common/utils/pageUtils";
import { Page } from "../common/components/layout/Page";

export const AnomaliePage = () => {
  const title = "Déclarer une anomalie";
  setTitle(title);

  return (
    <Page title={title}>
      <Box mt={4}></Box>
    </Page>
  );
};

export default AnomaliePage;
