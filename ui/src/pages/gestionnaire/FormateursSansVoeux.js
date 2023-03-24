import { useCallback } from "react";
import {
  Box,
  Button,
  Text,
  Input,
  Link,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import { _put } from "../../common/httpClient";
import { FormateurLibelle } from "../../common/components/fields/formateur/Libelle";
import { FormateurUai } from "../../common/components/fields/formateur/Uai";
import { FormateurSiret } from "../../common/components/fields/formateur/Siret";

const FormateurSansVoeux = ({ gestionnaire, formateur }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const activateDelegation = useCallback(async ({ form }) => {
    try {
      await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { email: form.email, diffusionAutorisee: true });
      onClose();
    } catch (error) {
      console.error(error);
    }
  });

  const openModal = useCallback(() => {
    console.log("open");
    onOpen();
  });

  return (
    <>
      <Tr key={formateur?.uai}>
        <Td>
          <Link variant="action" href={`/gestionnaire/formateurs/${formateur.uai}`}>
            Détail
          </Link>
        </Td>
        <Td>
          <FormateurLibelle formateur={formateur} />
        </Td>
        <Td>
          <FormateurSiret formateur={formateur} />
        </Td>
        <Td>
          <FormateurUai formateur={formateur} />
        </Td>
        <Td>
          <Button ml={4} variant="primary" onClick={openModal}>
            Déléguer
          </Button>
        </Td>
      </Tr>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Déléguer le droit de réception de la liste de vœux exprimés pour <FormateurLibelle formateur={formateur} />
          </ModalHeader>

          <ModalCloseButton />
          <ModalBody>
            <Formik
              initialValues={{
                email: etablissement.email,
              }}
              validationSchema={Yup.object().shape({
                email: Yup.string().required("Requis"),
                emailValidation: Yup.string().required("Requis"),
              })}
              onSubmit={(form) => activateDelegation({ form })}
            >
              <Form style={{ width: "100%" }}>
                <Text as="strong" mb={4}>
                  La personne à laquelle vous allez déléguer le droit de réception des listes doit impérativement
                  exercer au sein de l'établissement formateur.
                </Text>
                <Text fontStyle="italic" mb={4}>
                  Attention : si vous souhaitez modifier votre email en tant que directeur d'organisme responsable,
                  habilité à accéder aux listes de tous les organismes formateurs, n'utilisez cette fonctionnalité, et
                  accédez à votre <Link variant="action">page profil</Link>.
                </Text>
                <Text mb={4}>
                  Après validation de cette délégation, le destinataire sera automatiquement informé par courriel, et
                  devra procéder à la création de son mot de passe pour accéder à son espace de téléchargement. Si la
                  personne ne reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
                </Text>
                <Text mb={4}>
                  Cette délégation vous dispensera, en tant qu'organisme responsable, de télécharger les listes de vœux.
                  Vous conserverez néanmoins un accès à ces listes et vous pourrez visualiser le statut d'avancement de
                  la personne désignée : confirmation d'adresse courriel, création du mot de passe, téléchargement de la
                  liste, téléchargement de l'éventuelle mise à jour.
                </Text>
                <Text mb={4}>
                  Vous pourrez également, si nécessaire, récupérer le droit exclusif de réception des listes, ou
                  modifier l'email saisi.
                </Text>
                <Box>
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
                <Button variant="primary" mr={3} type="submit">
                  Valider
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Annulé
                </Button>
              </Form>
            </Formik>
          </ModalBody>
          {/* <ModalFooter> */}
          {/* </ModalFooter> */}
        </ModalContent>
      </Modal>
    </>
  );
};

export const FormateursSansVoeux = ({ gestionnaire, formateurs }) => {
  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th>Siret</Th>
          <Th>UAI</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
          return <FormateurSansVoeux gestionnaire={gestionnaire} formateur={formateur} />;
        })}
      </Tbody>
    </Table>
  );
};
