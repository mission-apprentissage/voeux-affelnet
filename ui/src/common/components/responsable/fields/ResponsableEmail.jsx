import { Text } from "@chakra-ui/react";

export const ResponsableEmail = ({ responsable }) => {
  return (
    <Text as="span">
      <strong>Vous</strong> ({responsable.email})
    </Text>
  );
};
