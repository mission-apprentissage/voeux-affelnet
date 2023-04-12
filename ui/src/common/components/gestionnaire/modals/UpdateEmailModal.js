import { useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
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
import * as Yup from "yup";

import { _put } from "../../../httpClient";

export const UpdateEmailModal = ({ gestionnaire, callback, isOpen, onClose }) => {
  function equalsTo(ref, msg) {
    return this.test({
      name: "equalTo",
      exclusive: false,
      // eslint-disable-next-line no-template-curly-in-string
      message: msg || "${path} must be the same as ${reference}",
      params: {
        reference: ref.path,
      },
      test: function (value) {
        return value === this.resolve(ref);
      },
    });
  }

  Yup.addMethod(Yup.string, "equalsTo", equalsTo);

  const updateEmail = useCallback(async ({ form }) => {
    try {
      await _put(`/api/gestionnaire`, { email: form.email });
      onClose();
      await callback?.();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modifier votre adresse email :</ModalHeader>

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
            <Form style={{ width: "100%" }} id="update-email-form">
              <Text mb={4}>{/* TODO : Texte à écrire */}</Text>

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

                <Field name="emailValidation" required>
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
            Annulé
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
