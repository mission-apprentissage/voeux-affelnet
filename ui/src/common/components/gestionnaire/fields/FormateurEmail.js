import { Flex, Text } from "@chakra-ui/react";
import { UserStatut } from "../../../constants/UserStatut";

export const FormateurEmail = ({ gestionnaire, formateur }) => {
  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      {diffusionAutorisee ? (
        <Text display={"inline"}>
          {[UserStatut.CONFIRME, UserStatut.ACTIVE].includes(formateur.statut) ? formateur.email : etablissement.email}
        </Text>
      ) : (
        <Flex alignItems="center">
          <Text mr={4}>
            <strong>Vous</strong> ({gestionnaire.email})
          </Text>
        </Flex>
      )}
    </>
  );
};
