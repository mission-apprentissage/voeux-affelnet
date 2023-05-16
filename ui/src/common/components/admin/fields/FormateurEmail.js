import { Text } from "@chakra-ui/react";
import { ContactResponsableTag } from "../../tags/ContactResponsable";
import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const FormateurEmail = ({ gestionnaire, formateur }) => {
  if (!gestionnaire || !formateur) {
    return;
  }

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      {diffusionAutorisee ? (
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
