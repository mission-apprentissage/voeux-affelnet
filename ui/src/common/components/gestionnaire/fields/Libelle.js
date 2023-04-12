import { Text } from "@chakra-ui/react";

export const GestionnaireLibelle = ({ gestionnaire }) => {
  if (!gestionnaire) return <></>;
  return (
    <Text display={"inline"}>
      {gestionnaire.raison_sociale ?? "Raison sociale inconnue"} ({gestionnaire.libelle_ville ?? "Ville inconnue"})
    </Text>
  );
};
