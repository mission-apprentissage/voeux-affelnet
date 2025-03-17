import { Text } from "@chakra-ui/react";
import { ContactResponsableTag } from "../../tags/ContactResponsable";
import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const ResponsableEmail = ({ responsable, formateur, delegue }) => {
  if (!responsable) {
    return;
  }

  const isDiffusionAutorisee = !!delegue;

  return (
    <>
      {isDiffusionAutorisee ? (
        <Text display={"inline"}>
          {delegue?.email ?? "Information manquante"} <ContactDelegueTag />
        </Text>
      ) : (
        <Text display={"inline"}>
          {responsable?.email ?? "Information manquante"} <ContactResponsableTag />
        </Text>
      )}
    </>
  );
};
