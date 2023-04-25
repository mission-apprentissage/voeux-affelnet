import { Box, Heading, Text } from "@chakra-ui/react";

export const Page = ({ title, children }) => {
  return (
    <Box pb={12}>
      <Heading as="h2" size="lg" mb={8}>
        {title}
      </Heading>
      <Box>{children}</Box>
    </Box>
  );
};
