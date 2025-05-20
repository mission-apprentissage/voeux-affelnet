import { Text } from "@chakra-ui/react";

export const EtablissementRaisonSociale = ({ etablissement }) => {
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
      <EtablissementRaisonSociale etablissement={etablissement} />, {etablissement.libelle_ville ?? "Ville inconnue"}{" "}
      (Siret : {etablissement.siret ?? "Inconnu"} - UAI : {etablissement.uai ?? "Inconnu"})
    </Text>
  );
};
