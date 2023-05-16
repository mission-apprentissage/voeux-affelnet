import { Box, Link } from "@chakra-ui/react";

export const NavigationMenu = () => {
  return (
    <Box my={8}>
      <Link variant="action" href="/">
        Retour à l'accueil
      </Link>
    </Box>
  );
};
