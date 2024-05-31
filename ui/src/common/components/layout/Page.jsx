import { Box, Heading } from "@chakra-ui/react";
import { setTitle } from "../../utils/pageUtils";

export const Page = ({ title, children }) => {
  setTitle(title);

  return (
    <Box pb={12}>
      <Heading as="h2" size="lg" mb={8}>
        {title}
      </Heading>
      <Box>{children}</Box>
    </Box>
  );
};
