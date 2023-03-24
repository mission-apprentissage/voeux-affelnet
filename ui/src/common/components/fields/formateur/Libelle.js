import { Text } from "@chakra-ui/react";

export const FormateurLibelle = ({ formateur }) => {
  if (!formateur) return <></>;
  return (
    <Text>
      {formateur.raison_sociale} ({formateur.libelle_ville})
    </Text>
  );
};
