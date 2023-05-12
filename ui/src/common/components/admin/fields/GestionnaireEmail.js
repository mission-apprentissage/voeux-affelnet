import { Text } from "@chakra-ui/react";
import { ContactResponsableTag } from "../../tags/ContactResponsable";
import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const GestionnaireEmail = ({ gestionnaire, formateur }) => {
  if (!gestionnaire || !formateur) {
    return;
  }

  console.log({ gestionnaire, formateur });

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  return (
    <>
      {etablissement.diffusionAutorisee ? (
        <Text display={"inline"}>
          {etablissement.email} <ContactDelegueTag />
        </Text>
      ) : (
        <Text display={"inline"}>
          {gestionnaire.email} <ContactResponsableTag />
        </Text>
      )}
    </>
  );
};
