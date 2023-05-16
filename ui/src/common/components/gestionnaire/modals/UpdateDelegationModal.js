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
  Heading,
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";

import { Yup } from "../../../Yup";
import { _put } from "../../../httpClient";
import { FormateurLibelle } from "../../formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../gestionnaire/fields/FormateurEmail";

export const UpdateDelegationModal = ({ gestionnaire, formateur, callback, isOpen, onClose }) => {
  const updateDelegationEmail = useCallback(
    async ({ form }) => {
      try {
        await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { email: form.email, diffusionAutorisee: true });
        onClose();
        await callback?.();
      } catch (error) {
        console.error(error);
      }
    },
    [callback, onClose, formateur?.uai]
  );

  const cancelDelegation = useCallback(
    async ({ form }) => {
      try {
        await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { diffusionAutorisee: false });
        onClose();
        await callback?.();
      } catch (error) {
        console.error(error);
      }
    },
    [callback, onClose, formateur?.uai]
  );

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Modifier la délégation de droit de réception de la liste de candidats pour{" "}
            <FormateurLibelle formateur={formateur} />
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Text fontSize="lg" mb={4}>
            Vous vous apprêtez à modifier le destinataire de la délégation de droits au sein de l'organisme formateur{" "}
            <FormateurLibelle formateur={formateur} />, actuellement{" "}
            <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} />.
          </Text>
          <Text mb={4}>
            <strong>Précisez ce que vous souhaitez faire :</strong>
          </Text>
          <Accordion defaultIndex={[]} allowToggle>
            <AccordionItem mb={0}>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Annuler la délégation et récupérer le rôle exclusif de réception des listes de candidats
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
                    Annuler
                  </Button>
                </Stack>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem mb={4}>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Saisir une autre adresse courriel habilitée à réceptionner les liste de candidats au sein de
                    l'organisme formateur
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
                    email_confirmation: Yup.string()
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

                    <Stack>
                      <Button variant="primary" type="submit" form="update-email-form">
                        Valider
                      </Button>
                      <Button variant="ghost" onClick={onClose}>
                        Annuler
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
