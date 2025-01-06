import { Text } from "@chakra-ui/react";

export const FormateurEmail = ({ responsable, formateur, delegue }) => {
  const isDiffusionAutorisee = !!delegue?.relations.find(
    (relation) =>
      relation.active &&
      relation.etablissement_responsable.uai === responsable?.uai &&
      relation.etablissement_formateur.uai === formateur?.uai
  );

  return (
    <>
      <Text as="span">
        {isDiffusionAutorisee ? (
          <>
            <strong>Vous</strong> ({delegue.email})
          </>
        ) : (
          <>{responsable?.email}</>
        )}
      </Text>
    </>
  );
};
