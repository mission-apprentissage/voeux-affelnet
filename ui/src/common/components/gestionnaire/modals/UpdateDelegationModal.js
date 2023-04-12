import { useCallback } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
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
  ModalHeader,
  ModalOverlay,
  Text,
  Stack,
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import { _put } from "../../../httpClient";
import { FormateurLibelle } from "../../formateur/fields/Libelle";
import { FormateurEmail } from "../../formateur/fields/Email";

export const UpdateDelegationModal = ({ gestionnaire, formateur, callback, isOpen, onClose }) => {
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

  const updateDelegationEmail = useCallback(async ({ form }) => {
    try {
      await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { email: form.email, diffusionAutorisee: true });
      onClose();
      await callback?.();
    } catch (error) {
      console.error(error);
    }
  });

  const cancelDelegation = useCallback(async ({ form }) => {
    try {
      await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { diffusionAutorisee: false });
      onClose();
      await callback?.();
    } catch (error) {
      console.error(error);
    }
  });

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>
            Modifier la délégation de droit de réception de la liste de vœux exprimés pour{" "}
            <FormateurLibelle formateur={formateur} />
          </Text>
        </ModalHeader>

        <ModalCloseButton />
        <ModalBody>
          <Text mb={4}>
            <strong>
              Vous vous apprêtez à modifier le destinataire de la délégation de droits au sein de l'organisme formateur{" "}
              <FormateurLibelle formateur={formateur} />, actuellement{" "}
              <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} />.
            </strong>
          </Text>
          <Text mb={4}>
            <strong>Précisez ce que vous souhaitez faire :</strong>
          </Text>
          <Accordion defaultIndex={[]} allowToggle>
            <AccordionItem mb={0}>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Annuler la délégation et récupérer le rôle exclusif de réception des listes de vœux
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Text mb={4}>
                  Si vous souhaitez modifier votre email en tant que directeur d'organisme responsable, habilité à
                  accéder aux listes de tous les organismes formateurs, n'utilisez pas cette fonctionnalité, et accédez
                  à votre{" "}
                  <Link variant="action" href="/profil">
                    page profil
                  </Link>
                  .
                </Text>

                <Stack>
                  <Button variant="primary" onClick={cancelDelegation}>
                    Récupérer les droits exclusifs pour cet organisme formateur
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Annulé
                  </Button>
                </Stack>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem mb={4}>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Saisir une autre adresse courriel habilitée à réceptionner les liste de vœux au sein de l'organisme
                    formateur
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Formik
                  initialValues={{
                    email: etablissement.email,
                  }}
                  validationSchema={Yup.object().shape({
                    email: Yup.string().required("Requis"),
                    emailValidation: Yup.string()
                      .required("Requis")
                      .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
                  })}
                  onSubmit={(form) => updateDelegationEmail({ form })}
                >
                  <Form style={{ width: "100%" }} id="update-email-form">
                    <Text mb={4}>
                      <strong>
                        La personne à laquelle vous allez déléguer le droit de réception des listes doit impérativement
                        exercer au sein de l'établissement formateur.
                      </strong>
                    </Text>
                    <Text mb={4}>
                      Après validation de cette délégation, le destinataire sera automatiquement informé par courriel,
                      et devra procéder à la création de son mot de passe pour accéder à son espace de téléchargement.
                      Si la personne ne reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
                    </Text>

                    <Box mb={8}>
                      <Field name="email" required>
                        {({ field, meta }) => {
                          return (
                            <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                              <FormLabel name={field.name}>Indiquez l'email de la personne habilitée</FormLabel>
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

                    <Stack>
                      <Button variant="primary" type="submit" form="update-email-form">
                        Valider
                      </Button>
                      <Button variant="ghost" onClick={onClose}>
                        Annulé
                      </Button>
                    </Stack>
                  </Form>
                </Formik>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
