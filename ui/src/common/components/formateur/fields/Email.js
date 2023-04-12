import { Button, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { isResponsableFormateur } from "../../../utils/getUserType";
import { DelegationModal } from "../../gestionnaire/modals/DelegationModal";

export const FormateurEmail = ({ gestionnaire, formateur, callback, showDelegationButton }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      {diffusionAutorisee ? (
        <Text display={"inline"}>{etablissement.email}</Text>
      ) : (
        <Flex alignItems="center">
          <Text mr={4}>
            <strong>Vous</strong> ({gestionnaire.email})
          </Text>
          {!isResponsableFormateur({ gestionnaire, formateur }) && showDelegationButton && (
            <Button ml={4} variant="primary" onClick={onOpen}>
              Déléguer
            </Button>
          )}
        </Flex>
      )}

      <DelegationModal
        gestionnaire={gestionnaire}
        formateur={formateur}
        callback={callback}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
};
