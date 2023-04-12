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
import * as Yup from "yup";

import { _put } from "../../../httpClient";
import { FormateurLibelle } from "../../formateur/fields/Libelle";

export const DelegationModal = ({ gestionnaire, formateur, callback, isOpen, onClose }) => {
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

  const activateDelegation = useCallback(async ({ form }) => {
    try {
      await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { email: form.email, diffusionAutorisee: true });
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
              emailValidation: Yup.string()
                .required("Requis")
                .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
            })}
            onSubmit={(form) => activateDelegation({ form })}
          >
            <Form style={{ width: "100%" }} id="delegation-form">
              <Text mb={4}>
                <strong>
                  La personne à laquelle vous allez déléguer le droit de réception des listes doit impérativement
                  exercer au sein de l'établissement formateur.
                </strong>
              </Text>
              <Text fontStyle="italic" mb={4}>
                Attention : si vous souhaitez modifier votre email en tant que directeur d'organisme responsable,
                habilité à accéder aux listes de tous les organismes formateurs, n'utilisez cette fonctionnalité, et
                accédez à votre{" "}
                <Link variant="action" href="/profil">
                  page profil
                </Link>
                .
              </Text>
              <Text mb={4}>
                Après validation de cette délégation, le destinataire sera automatiquement informé par courriel, et
                devra procéder à la création de son mot de passe pour accéder à son espace de téléchargement. Si la
                personne ne reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
              </Text>
              <Text mb={4}>
                {/* TODO:  */}
                {true ? (
                  <>
                    {/* Pas de vœux ou vœux non téléchargés */}
                    Cette délégation vous dispensera, en tant qu'organisme responsable, de télécharger les listes de
                    vœux. Vous conserverez néanmoins un accès à ces listes et vous pourrez visualiser le statut
                    d'avancement de la personne désignée : confirmation d'adresse courriel, création du mot de passe,
                    téléchargement de la liste, téléchargement de l'éventuelle mise à jour.
                  </>
                ) : (
                  <>
                    {/* Voeux disponibles et téléchargés par le responsable */}
                    Cette délégation de droits aura pour effet de réinitialiser le statut de téléchargement :
                    actuellement considérée comme déjà téléchargée pour cet établissement, la liste devra à nouveau être
                    téléchargée par la personne désignée. Votre téléchargement restera toutefois enregistré dans
                    l'historique. Vous conserverez un accès à ces listes et vous pourrez visualiser le statut
                    d'avancement de la personne désignée : confirmation d'adresse courriel, création du mot de passe,
                    téléchargement de la liste, téléchargement de l'éventuelle mise à jour.
                  </>
                )}
              </Text>
              <Text mb={4}>
                Vous pourrez également, si nécessaire, récupérer le droit exclusif de réception des listes, ou modifier
                l'email saisi.
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
            </Form>
          </Formik>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" type="submit" form="delegation-form">
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
