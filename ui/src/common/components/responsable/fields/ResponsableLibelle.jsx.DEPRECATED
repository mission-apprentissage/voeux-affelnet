import { Text } from "@chakra-ui/react";

export const ResponsableLibelle = ({ responsable }) => {
  // if (!responsable) return <></>;
  return (
    <Text as="span">
      {responsable?.raison_sociale ?? "Raison sociale inconnue"}, {responsable?.libelle_ville ?? "Ville inconnue"}{" "}
      (SIRET : {responsable?.siret ?? "Inconnu"})
    </Text>
  );
};
