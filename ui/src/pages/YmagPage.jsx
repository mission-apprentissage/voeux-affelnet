import { Box, Link, ListItem, UnorderedList } from "@chakra-ui/react";
import { Page } from "../common/components/layout/Page";
import { Breadcrumb } from "../common/components/Breadcrumb";

export const YmagPage = () => {
  const title = "Utilisateur Ymag ou IGesti ?";

  return (
    <>
      <Breadcrumb items={[{ label: title, url: "/ymag-ou-igesti" }]} />

      <Page title={title}>
        <Box mt={4}>
          <UnorderedList>
            <ListItem>
              Si vous utilisez Ymag, et que vous souhaitez intégrer les candidatures à cet outil, vous trouverez plus
              d'informations ici :{" "}
              <Link variant="action" isExternal href="https://learn.ymag.fr/course/view.php?id=44235">
                https://learn.ymag.fr/course/view.php?id=44235
              </Link>
            </ListItem>

            <ListItem>
              Si vous utilisez IGesti, et que vous souhaitez intégrer les candidatures à cet outil, vous trouverez plus
              d'informations ici :{" "}
              <Link variant="action" isExternal href="/docs/03bis_Mode_Op_GESTI_Importation.pdf">
                Mode_Op_GESTI_Importation.pdf
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>
      </Page>
    </>
  );
};

export default YmagPage;
