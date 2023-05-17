import { useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";

import { Yup } from "../../../Yup";
import { _put } from "../../../httpClient";

export const UpdateGestionnaireEmailModal = ({ gestionnaire, callback, isOpen, onClose }) => {
  const toast = useToast();

  const updateEmail = useCallback(
    async ({ form }) => {
      try {
        await _put(`/api/gestionnaire/setEmail`, { email: form.email });
        toast({
          title: "Votre adresse courriel a été modifiée",
          description:
            "C'est à cette adresse que vous recevrez les mises à jour des listes de candidats pour les établissements donc vous être responsables.",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
        onClose();
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
    [callback, onClose, toast]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Modifier votre adresse email
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Formik
            initialValues={{
              email: gestionnaire.email,
            }}
            validationSchema={Yup.object().shape({
              email: Yup.string().required("Requis"),
              email_confirmation: Yup.string()
                .required("Requis")
                .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
            })}
            onSubmit={(form) => updateEmail({ form })}
          >
            <Form style={{ width: "100%" }} id="update-email-form">
              {/* <Text fontSize="lg" mb={4}> */}
              {/* TODO :  */}
              {/* </Text> */}

              <Box mb={8}>
                <Field name="email" required>
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                        <FormLabel name={field.name}>Indiquez votre nouvel email</FormLabel>
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
                        <FormLabel name={field.name}>Veuillez saisir l'email une seconde fois</FormLabel>
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
          <Button variant="primary" type="submit" form="update-email-form">
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
