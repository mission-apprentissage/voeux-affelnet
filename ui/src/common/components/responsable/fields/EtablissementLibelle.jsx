import { Text } from "@chakra-ui/react";

export const Etablissement = ({ etablissement }) => {
  // if (!etablissement) return <></>;
  return (
    <Text as="span">
      {etablissement?.raison_sociale ?? "Raison sociale inconnue"}, {etablissement?.libelle_ville ?? "Ville inconnue"}{" "}
      (SIRET : {etablissement?.siret ?? "Inconnu"} / UAI : {etablissement?.uai ?? "Inconnu"})
    </Text>
  );
};
