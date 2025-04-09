import { useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";

import { _put } from "../../../httpClient";
import { emailConfirmationSchema } from "../../../utils/validationUtils";
import { EtablissementLibelle } from "../../etablissement/fields/EtablissementLibelle";

export const UpdateResponsableEmailModal = ({ responsable, callback, isOpen, onClose }) => {
  const toast = useToast();

  const updateEmail = useCallback(
    async ({ form }) => {
      try {
        await _put(`/api/admin/responsables/${responsable.siret}/setEmail`, { email: form.email });
        onClose();
        toast({
          title: "L'adresse courriel a été modifiée",
          description:
            "C'est à cette adresse que l'établissement recevra les mises à jour des listes de candidats pour les établissements dont il est responsable.",
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
    [onClose, callback, responsable?.siret, toast]
  );

  const hasDelegation = !!responsable.relations?.filter((relation) => !!relation.delegue)?.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Modifier l'adresse courriel de contact pour l'organisme responsable{" "}
          <EtablissementLibelle etablissement={responsable} /> :
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Formik
            initialValues={{
              email: responsable.email,
            }}
            validationSchema={emailConfirmationSchema}
            onSubmit={(form) => updateEmail({ form })}
          >
            <Form style={{ width: "100%" }} id="update-responsable-email-form">
              <Text mb={4}>
                <strong>
                  L'interlocuteur dont vous vous apprêtez à modifier l'adresse courriel ({responsable.email}) est
                  responsable de {responsable.relations?.length} organisme
                  {responsable.relations?.length > 1 && "s"} formateur
                  {responsable.relations?.length > 1 && "s"} (
                  <Link
                    variant="action"
                    href={`/admin/etablissement/${responsable.siret}#responsable`}
                    onClick={onClose}
                  >
                    voir la liste
                  </Link>
                  ). Le nouvel interlocuteur deviendra le contact responsable pour l'ensemble des établissements.
                </strong>
              </Text>

              {hasDelegation && (
                <Text mb={4}>
                  <Text as="i">
                    Le contact actuel a précédemment délégué les droits de réception des listes à tout ou partie des
                    organismes formateurs dont il est responsable. Ces délégations de droits seront inchangées. Le
                    contact que vous allez créer aura la possibilité de modifier ou d'annuler ces délégations de droits.
                  </Text>
                </Text>
              )}
              <Text mb={4}>
                Après modification, le nouveau contact sera automatiquement informé par courriel, et devra procéder à la
                création de son mot de passe pour accéder à son espace de téléchargement. Si la personne ne reçoit pas
                le courriel de confirmation de son adresse, invitez-la à vérifier dans ses spam.
              </Text>
              <Box mb={8}>
                <Field name="email" required>
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                        <FormLabel name={field.name}>Indiquez la nouvelle adresse courriel</FormLabel>
                        <Input
                          type="email"
                          role="presentation"
                          placeholder="Renseigner l'email"
                          style={{ margin: 0 }}
                          {...field}
                        />
                        <FormErrorMessage>{meta.error || "Email invalide"}</FormErrorMessage>
                      </FormControl>
                    );
                  }}
                </Field>

                <Field name="email_confirmation" required>
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                        <FormLabel name={field.name}>Veuillez saisir l'adresse une seconde fois</FormLabel>
                        <Input
                          type="email"
                          role="presentation"
                          placeholder="Renseigner l'email"
                          style={{ margin: 0 }}
                          {...field}
                        />
                        <FormErrorMessage>{meta.error || "Email invalide"}</FormErrorMessage>
                      </FormControl>
                    );
                  }}
                </Field>
              </Box>
            </Form>
          </Formik>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" type="submit" form="update-responsable-email-form">
            Valider
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
