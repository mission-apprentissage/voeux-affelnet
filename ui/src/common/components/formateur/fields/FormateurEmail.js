import { Text } from "@chakra-ui/react";
import { UserStatut } from "../../../constants/UserStatut";

export const FormateurEmail = ({ gestionnaire, formateur }) => {
  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      <Text display={"inline"}>
        {diffusionAutorisee ? (
          <>
            <strong>Vous</strong> (
            {[UserStatut.CONFIRME, UserStatut.ACTIVE].includes(formateur.statut)
              ? formateur.email
              : etablissement.email}
            )
          </>
        ) : (
          <>{gestionnaire.email}</>
        )}
      </Text>
    </>
  );
};
