import { useCallback } from "react";
import {
  Box,
  Button,
  Checkbox,
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
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Switch,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { Formik, Field } from "formik";

import { EtablissementRaisonSociale } from "../../etablissement/fields/EtablissementLibelle";
import { DownloadIcon } from "@chakra-ui/icons";
import { useDownloadVoeux } from "../../../hooks/adminHooks";
import { Yup } from "../../../Yup";

export const DownloadModal = ({ relation, callback, isOpen, onClose }) => {
  const toast = useToast();

  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;

  const { downloadVoeux, isDownloadingVoeux } = useDownloadVoeux({
    responsable,
    formateur,
    callback,
  });

  const downloadAndClose = useCallback(
    async ({ form }) => {
      console.log({
        responsable: relation.responsable,
        formateur: relation.formateur,
        ...(form.mark_as_downloaded ? { mark_as_downloaded: form.mark_as_downloade, comment: form.comment } : {}),
      });
      try {
        await downloadVoeux({
          responsable: relation.responsable,
          formateur: relation.formateur,
          ...(form.mark_as_downloaded ? { mark_as_downloaded: form.mark_as_downloaded, comment: form.comment } : {}),
        });

        onClose();
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
    [downloadVoeux, relation.responsable, relation.formateur, onClose, toast]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>
          Téléchargement de la liste des candidats pour l'établissement formateur{" "}
          <EtablissementRaisonSociale etablissement={relation.responsable} />
        </ModalHeader>
        <ModalCloseButton />

        <Formik
          initialValues={{
            mark_as_downloaded: null,
            comment: "",
          }}
          validationSchema={Yup.object().shape({
            mark_as_downloaded: Yup.boolean().required("Le choix est obligatoire"),
            comment: Yup.string().when("mark_as_downloaded", {
              is: true,
              then: Yup.string()
                .required("Le commentaire est obligatoire")
                .min(10, "Le commentaire doit faire au moins 10 caractères")
                .max(2000, "Le commentaire doit faire au plus 2000 caractères"),
              otherwise: Yup.string().notRequired(),
            }),
          })}
          enableReinitialize={true}
          onSubmit={(form) => downloadAndClose({ form })}
        >
          {(props) => (
            <>
              <ModalBody>
                <Box>
                  <Text>
                    Vous êtes sur le point de télécharger la liste de candidats en tant qu’administrateur (SAIO ou
                    SRFD).
                  </Text>
                </Box>

                <Box mt={6}>
                  <Field name="mark_as_downloaded">
                    {({ field, meta }) => {
                      const { onChange, ...rest } = field;
                      console.log({ field, meta });

                      return (
                        <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                          <FormLabel name={field.name}>
                            Ce téléchargement doit-il est considéré comme effectif pour l’organisme de formation en
                            apprentissage ? Si oui, vous vous engagez à transmettre la liste à la personne habilitée au
                            sein de l’organisme, et ce de manière sécurisée.
                          </FormLabel>
                          <Stack direction="row">
                            <RadioGroup {...rest} id={field.name}>
                              <Radio
                                value={false}
                                isChecked={field.value === false}
                                onChange={() => props.setFieldValue(field.name, false)}
                                mr={4}
                              >
                                Non
                              </Radio>
                              <Radio
                                value={true}
                                isChecked={field.value === true}
                                onChange={() => props.setFieldValue(field.name, true)}
                                mr={4}
                              >
                                Oui
                              </Radio>
                            </RadioGroup>
                          </Stack>
                        </FormControl>
                      );
                    }}
                  </Field>
                </Box>
                {props.values.mark_as_downloaded && (
                  <Box mt={6}>
                    <Field name="comment" required>
                      {({ field, meta }) => {
                        return (
                          <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                            <FormLabel name={field.name}>
                              Veuillez préciser pour quelle raison ce téléchargement est effectué. Cette information
                              sera visible dans l’historique, uniquement par vous et par les administrateurs au national
                              (DNE, Dgesco), dans un but d’amélioration continue du service.
                            </FormLabel>
                            <Textarea size="lg" {...field} />

                            <FormErrorMessage>{meta.error || "Le commentaire est invalide"}</FormErrorMessage>
                          </FormControl>
                        );
                      }}
                    </Field>
                  </Box>
                )}
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} variant="secondary" mr={3} mt={6}>
                  Annuler
                </Button>

                <Button
                  onClick={() => props.handleSubmit()}
                  variant="primary"
                  disabled={props.isInvalid || isDownloadingVoeux}
                  mr={3}
                  mt={6}
                >
                  {isDownloadingVoeux ? <Spinner size="sm" mr={2} /> : <DownloadIcon mr={2} />}
                  Valider
                </Button>
              </ModalFooter>
            </>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};
