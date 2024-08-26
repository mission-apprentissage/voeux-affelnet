import { Box } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const DonneesPersonnelles = () => {
  const title = "Données Personnelles";

  return (
    <>
      <Breadcrumb items={[{ label: title, url: "/donnees-personnelles" }]} />

      <Page title={title}>
        <Box mt={4}></Box>
      </Page>
    </>
  );
};

export default DonneesPersonnelles;
