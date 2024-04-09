import { Text } from "@chakra-ui/react";
import { ContactResponsableTag } from "../../tags/ContactResponsable";
import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const ResponsableEmail = ({ responsable, formateur }) => {
  if (!responsable || !formateur) {
    return;
  }

  console.log({ responsable, formateur });

  const etablissement = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  return (
    <>
      {etablissement.diffusionAutorisee ? (
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
