import { Text } from "@chakra-ui/react";

export const EtablisssementRaisonSociale = ({ etablissement }) => {
  if (!etablissement) return <></>;
  return (
    <Text display={"inline"}>
      {etablissement.raison_sociale ?? "Raison sociale inconnue"}
      {etablissement.enseigne && etablissement.raison_sociale !== etablissement.enseigne && (
        <Text as="i"> ({etablissement.enseigne})</Text>
      )}
    </Text>
  );
};
export const EtablissementLibelle = ({ etablissement }) => {
  if (!etablissement) return <></>;
  return (
    <Text display={"inline"}>
      <EtablisssementRaisonSociale etablissement={etablissement} />, {etablissement.libelle_ville ?? "Ville inconnue"}{" "}
      (UAI : {etablissement.uai ?? "Inconnu"})
    </Text>
  );
};
