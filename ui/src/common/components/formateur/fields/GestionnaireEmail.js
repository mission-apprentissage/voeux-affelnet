import { Text } from "@chakra-ui/react";

export const GestionnaireEmail = ({ gestionnaire }) => {
  return <Text display={"inline"}>{gestionnaire.email}</Text>;
};
