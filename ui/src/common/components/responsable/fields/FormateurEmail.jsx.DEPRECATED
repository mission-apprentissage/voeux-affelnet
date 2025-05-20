import { Text } from "@chakra-ui/react";

export const FormateurEmail = ({ responsable, delegue }) => {
  const isDiffusionAutorisee = !!delegue;

  return (
    <>
      {isDiffusionAutorisee ? (
        <Text as="span">{delegue?.email ?? "Information manquante"}</Text>
      ) : (
        <Text as="span">
          <strong>Vous</strong> ({responsable?.email ?? "Information manquante"})
        </Text>
      )}
    </>
  );
};
