import { Tag, Text } from "@chakra-ui/react";

export const FormateurEmail = ({ gestionnaire, formateur }) => {
  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      {diffusionAutorisee ? (
        <Text display={"inline"}>
          {etablissement.email} <Tag>D</Tag>
        </Text>
      ) : (
        <Text display={"inline"}>
          {gestionnaire.email} <Tag>R</Tag>
        </Text>
      )}
    </>
  );
};
