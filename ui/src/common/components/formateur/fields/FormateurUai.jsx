import { Text } from "@chakra-ui/react";

export const FormateurUai = ({ formateur }) => {
  if (!formateur) return <></>;
  return <Text as="span">{formateur?.uai}</Text>;
};
