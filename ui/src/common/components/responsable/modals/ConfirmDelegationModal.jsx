import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Stack,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { Formik, Form } from "formik";

import { _post } from "../../../httpClient";
import { FormateurLibelle } from "../../formateur/fields/FormateurLibelle";

export const ConfirmDelegationModal = ({ relation, callback, isOpen, onClose }) => {
  const toast = useToast();

  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;
  const delegue = relation.delegue;

  const updateDelegationEmail = useCallback(
    async ({ form }) => {
      try {
        await _post(`/api/responsable/delegation`, {
          email: form.email,
          siret: formateur?.siret,
        });

        onClose();
        toast({
          title: "Délégation confirmée",
          description: (
            <>
              La délégation de droit a été confirmée pour le formateur <FormateurLibelle formateur={formateur} /> vers
              l'adresse courriel {delegue.email}
            </>
          ),
          status: "success",
          duration: 9000,
          isClosable: true,
        });
        await callback?.();
      } catch (error) {
        console.error(error);
        toast({
          title: "Une erreur s'est produite",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    },
    [delegue, formateur, onClose, toast, callback]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Confirmation de la délégation de droit de réception de la liste de candidats pour{" "}
            <FormateurLibelle formateur={formateur} />
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Text fontSize="lg" mb={6}>
            Vous vous apprêtez à confirmer <Text as="b">{delegue.email}</Text>, précédemment destinataire de la
            délégation de droits 2024 au sein de l'organisme formateur <FormateurLibelle formateur={formateur} /> comme
            destinataire pour cette campagne 2025.
          </Text>

          <Formik
            initialValues={{
              email: delegue.email,
            }}
            onSubmit={(form) => updateDelegationEmail({ form })}
          >
            <Form style={{ width: "100%" }} id="confirm-form">
              <Text mb={4}>
                Après validation de cette délégation, le destinataire sera automatiquement informé par courriel, et
                devra procéder à la création de son mot de passe pour accéder à son espace de téléchargement. Si la
                personne ne reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
              </Text>

              <Stack>
                <Button variant="primary" type="submit" form="confirm-form">
                  Valider
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Annuler
                </Button>
              </Stack>
            </Form>
          </Formik>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
