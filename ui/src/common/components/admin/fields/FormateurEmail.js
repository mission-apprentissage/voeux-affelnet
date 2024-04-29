import { Text } from "@chakra-ui/react";
import { ContactResponsableTag } from "../../tags/ContactResponsable";
import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const FormateurEmail = ({ responsable, formateur, delegue }) => {
  if (!responsable || !formateur) {
    return;
  }

  const isDiffusionAutorisee = !!delegue;

  return (
    <>
      {isDiffusionAutorisee ? (
        <Text display={"inline"}>
          {delegue?.email} <ContactDelegueTag />
        </Text>
      ) : (
        <Text display={"inline"}>
          {responsable.email} <ContactResponsableTag />
        </Text>
      )}
    </>
  );
};
