import { Text } from "@chakra-ui/react";
// import { ContactResponsableTag } from "../../tags/ContactResponsable";
// import { ContactDelegueTag } from "../../tags/ContactDelegue";

export const RelationEmail = ({ relation }) => {
  if (!relation) {
    return;
  }

  const isDiffusionAutorisee = !!relation.delegue; // && relation.delegue.relations.active;

  return (
    <>
      {isDiffusionAutorisee ? (
        <Text display={"inline"} as="b">
          {relation?.delegue?.email ?? "Information manquante"}
        </Text>
      ) : (
        <Text display={"inline"} as="b">
          {relation?.responsable?.email ?? "Information manquante"}
        </Text>
      )}
    </>
  );
};
