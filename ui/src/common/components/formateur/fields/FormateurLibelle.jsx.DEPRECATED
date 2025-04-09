import { Text } from "@chakra-ui/react";

export const FormateurLibelle = ({ formateur }) => {
  // if (!formateur) return <></>;
  return (
    <Text as="span">
      {formateur?.raison_sociale ?? "Raison sociale inconnue"}, {formateur?.libelle_ville ?? "Ville inconnue"} (SIRET :{" "}
      {formateur?.siret ?? "Inconnu"})
    </Text>
  );
};
