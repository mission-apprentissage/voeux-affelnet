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
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";

import { Yup } from "../../../Yup";
import { _put } from "../../../httpClient";
import { GestionnaireLibelle } from "../../gestionnaire/fields/GestionnaireLibelle";

export const UpdateGestionnaireEmailModal = ({ gestionnaire, callback, isOpen, onClose }) => {
  const updateEmail = useCallback(
    async ({ form }) => {
      try {
        await _put(`/api/admin/gestionnaires/${gestionnaire.siret}/setEmail`, { email: form.email });
        onClose();
        await callback?.();
      } catch (error) {
        console.error(error);
      }
    },
    [onClose, callback, gestionnaire?.siret]
  );

  const hasDelegation = !!gestionnaire.etablissements?.filter((etablissement) => etablissement.diffusionAutorisee)
    ?.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Modifier l'adresse courriel de contact pour l'organisme responsable{" "}
          <GestionnaireLibelle gestionnaire={gestionnaire} /> :
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Formik
            initialValues={{
              email: gestionnaire.email,
            }}
            validationSchema={Yup.object().shape({
              email: Yup.string().required("Requis"),
              emailValidation: Yup.string()
                .required("Requis")
                .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
            })}
            onSubmit={(form) => updateEmail({ form })}
          >
            <Form style={{ width: "100%" }} id="update-gestionnaire-email-form">
              <Text mb={4}>
                <strong>
                  L'interlocuteur dont vous vous apprêtez à modifier l'adresse courriel ({gestionnaire.email}) est
                  responsable de {gestionnaire.etablissements.length} organisme
                  {gestionnaire.etablissements.length > 1 && "s"} formateur
                  {gestionnaire.etablissements.length > 1 && "s"} (
                  <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateurs`}>
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

                <Field name="emailValidation" required>
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
          <Button variant="primary" type="submit" form="update-gestionnaire-email-form">
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
