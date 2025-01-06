import { Text } from "@chakra-ui/react";

export const ResponsableEmail = ({ responsable }) => {
  return <Text as="span">{responsable?.email ?? "Information manquante"}</Text>;
};
