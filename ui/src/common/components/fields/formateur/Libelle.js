import { Text } from "@chakra-ui/react";

export const FormateurLibelle = ({ formateur }) => {
  if (!formateur) return <></>;
  return <Text>{formateur.libelle} ({formateur.libelle_ville})</Text>;
};
