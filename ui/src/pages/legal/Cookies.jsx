import { Box, Link, Text } from "@chakra-ui/react";
import { ExternalLinkLine } from "../../theme/components/icons";
import { Page } from "../../common/components/layout/Page";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const Cookies = () => {
  const title = "Gestion des Cookies";

  return (
    <>
      <Breadcrumb items={[{ label: title, url: "/cookies" }]} />

      <Page title={title}>
        <Box pt={4} pb={16}>
          <Text>
            Pour les utilisateurs connectés, ce site dépose un petit fichier texte (un « cookie ») sur votre ordinateur
            pour vous authentifier et garder votre session active.
            <br />
            Cela nous permet de vous laisser connecté même si vous consultez le site dans un nouvel onglet, et de vous
            éviter de vous reconnecter à chaque fois que vous visitez le site.
            <br />
            <br />
            Ce site n’affiche pas de bannière de consentement aux cookies car les cookies d'authentification en sont
            exemptés, cf.{" "}
            <Link
              href={"https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi"}
              textDecoration={"underline"}
              isExternal
            >
              https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi{" "}
              <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} />
            </Link>
            .
          </Text>
        </Box>
      </Page>
    </>
  );
};

export default Cookies;
