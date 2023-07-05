import React from "react";
import { Box } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";

export const DonneesPersonnelles = () => {
  const title = "Données Personnelles";

  return (
    <Page title={title}>
      <Box mt={4}></Box>
    </Page>
  );
};

export default DonneesPersonnelles;
