import { useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
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

import { Yup } from "../../../Yup";
import { _put } from "../../../httpClient";
import { FormateurLibelle } from "../../formateur/fields/FormateurLibelle";

export const DelegationModal = ({ responsable, formateur, callback, isOpen, onClose }) => {
  const toast = useToast();

  const activateDelegation = useCallback(
    async ({ form }) => {
      try {
        await _put(`/api/admin/responsables/${responsable.siret}/formateurs/${formateur.uai}`, {
          email: form.email,
          diffusionAutorisee: true,
        });
        onClose();
        toast({
          title: "Délégation mise à jour",
          description: `La délégation de droit a été enregistrée pour le formateur ${formateur.uai} vers l'adresse courriel ${form.email}`,
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
    [onClose, callback, responsable?.siret, formateur?.uai, toast]
  );

  const etablissement = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const hasVoeux = etablissement.nombre_voeux > 0;

  const voeuxTelechargementsParResponsable = responsable.voeux_telechargements_formateur.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  const voeuxTelecharges = !!voeuxTelechargementsParResponsable.find(
    (telechargement) => new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Déléguer le droit de réception de la liste de candidats pour <FormateurLibelle formateur={formateur} />
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Formik
            initialValues={{
              email: etablissement.email,
            }}
            validationSchema={Yup.object().shape({
              email: Yup.string().email().required("Requis"),
              email_confirmation: Yup.string()
                .email()
                .required("Requis")
                .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
            })}
            onSubmit={(form) => activateDelegation({ form })}
          >
            <Form style={{ width: "100%" }} id="delegation-form">
              <Text fontSize="lg" mb={4}>
                {hasVoeux && voeuxTelecharges ? (
                  <>
                    {/* Voeux disponibles et téléchargés par le responsable */}
                    Cette délégation de droits aura pour effet de réinitialiser le statut de téléchargement :
                    actuellement considérée comme déjà téléchargée pour cet établissement, la liste devra à nouveau être
                    téléchargée par la personne désignée. Le téléchargement du responsable restera toutefois enregistré
                    dans l'historique. Celui-ci conservera un accès à ces listes et pourra visualiser le statut
                    d'avancement de la personne désignée : confirmation d'adresse courriel, création du mot de passe,
                    téléchargement de la liste, téléchargement de l'éventuelle mise à jour.
                  </>
                ) : (
                  <>
                    {/* Pas de vœux ou vœux non téléchargés */}
                    Cette délégation dispensera l'organisme responsable de télécharger les listes de vœux. Il conservera
                    néanmoins un accès à ces listes et pourra visualiser le statut d'avancement de la personne désignée
                    : confirmation d'adresse courriel, création du mot de passe, téléchargement de la liste,
                    téléchargement de l'éventuelle mise à jour.
                  </>
                )}
              </Text>
              <Text mb={4}>
                Après validation de cette délégation, le destinataire sera automatiquement informé par courriel, et
                devra procéder à la création de son mot de passe pour accéder à son espace de téléchargement. Si la
                personne ne reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
              </Text>
              <Text mb={4}>
                Vous pourrez également, si nécessaire, redonner le droit exclusif de réception des listes au
                responsable, ou modifier l'email saisi.
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
            </Form>
          </Formik>

          <Box mb={4}>
            <Link href="/support" variant="action">
              Besoin d'assistance ?
            </Link>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" type="submit" form="delegation-form">
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
