import { Text } from "@chakra-ui/react";

export const FormateurSiret = ({ formateur }) => {
  if (!formateur) return <></>;
  return <Text as="span">{formateur?.siret}</Text>;
};
