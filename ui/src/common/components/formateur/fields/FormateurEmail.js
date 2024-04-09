import { Text } from "@chakra-ui/react";
import { UserStatut } from "../../../constants/UserStatut";

export const FormateurEmail = ({ responsable, formateur }) => {
  const etablissement = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

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
          <>{responsable.email}</>
        )}
      </Text>
    </>
  );
};
