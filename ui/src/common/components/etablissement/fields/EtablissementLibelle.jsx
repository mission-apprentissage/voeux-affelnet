import { Text } from "@chakra-ui/react";

export const EtablissementLibelle = ({ etablissement }) => {
  if (!etablissement) return <></>;
  return (
    <Text display={"inline"}>
      {etablissement.raison_sociale ?? "Raison sociale inconnue"}, {etablissement.libelle_ville ?? "Ville inconnue"}{" "}
      (UAI : {etablissement.uai ?? "Inconnu"})
    </Text>
  );
};
