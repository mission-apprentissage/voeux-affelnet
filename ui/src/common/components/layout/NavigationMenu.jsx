import { Box, Link } from "@chakra-ui/react";
import { ArrowLeftLine } from "../../../theme/components/icons";

export const NavigationMenu = () => {
  return (
    <Box my={8}>
      <Link href="/" whiteSpace="nowrap" fontWeight="600" color="bluefrance">
        <ArrowLeftLine margin="auto" marginRight="2" height="24px" width="24px" verticalAlign="text-top" />
        Retour à l'accueil
      </Link>
    </Box>
  );
};
