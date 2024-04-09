import { Text } from "@chakra-ui/react";
import { ContactResponsableTag } from "../../tags/ContactResponsable";
import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const FormateurEmail = ({ responsable, formateur }) => {
  if (!responsable || !formateur) {
    return;
  }

  const etablissement = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      {diffusionAutorisee ? (
        <Text display={"inline"}>
          {etablissement.email} <ContactDelegueTag />
        </Text>
      ) : (
        <Text display={"inline"}>
          {responsable.email} <ContactResponsableTag />
        </Text>
      )}
    </>
  );
};
