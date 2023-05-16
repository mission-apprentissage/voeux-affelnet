import { Text } from "@chakra-ui/react";

export const GestionnaireEmail = ({ gestionnaire }) => {
  return (
    <Text as="span">
      <strong>Vous</strong> ({gestionnaire.email})
    </Text>
  );
};
