import React from "react";
import { Box, Link, List, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import { setTitle } from "../common/utils/pageUtils";
import { Page } from "../common/components/layout/Page";

export const YmagPage = () => {
  const title = "Utilisateur Ymag ou IGesti ?";
  setTitle(title);

  return (
    <Page title={title}>
      <Box mt={4}>
        <UnorderedList>
          <ListItem>
            Si vous utilisez Ymag, et que vous souhaitez intégrer les vœux à cet outil, vous trouverez plus
            d'informations ici :{" "}
            <Link variant="action" isExternal href="https://learn.ymag.fr/course/view.php?id=44235">
              https://learn.ymag.fr/course/view.php?id=44235
            </Link>
          </ListItem>

          <ListItem>
            Si vous utilisez IGesti, et que vous souhaitez intégrer les vœux à cet outil, vous trouverez plus
            d'informations ici :{" "}
            <Link variant="action" isExternal href="/docs/03bis_Mode_Op_GESTI_Importation.pdf">
              Mode_Op_GESTI_Importation.pdf
            </Link>
          </ListItem>
        </UnorderedList>
      </Box>
    </Page>
  );
};

export default YmagPage;
