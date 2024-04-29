import { Text } from "@chakra-ui/react";

export const ResponsableLibelle = ({ responsable }) => {
  if (!responsable) return <></>;
  return (
    <Text as="span">
      {responsable?.raison_sociale ?? "Raison sociale inconnue"}, {responsable?.libelle_ville ?? "Ville inconnue"} (UAI
      : {responsable?.uai ?? "Inconnu"})
    </Text>
  );
};
