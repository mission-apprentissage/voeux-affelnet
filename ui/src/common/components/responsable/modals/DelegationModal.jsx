import { useCallback } from "react";
import {
  Alert,
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

import { _post } from "../../../httpClient";
import { emailConfirmationSchema } from "../../../utils/validationUtils";
import { CONTACT_TYPE } from "../../../constants/ContactType";
import { EtablissementLibelle } from "../../etablissement/fields/EtablissementLibelle";

export const DelegationModal = ({ relation, callback, isOpen, onClose }) => {
  const toast = useToast();

  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;
  const delegue = relation.delegue;

  const activateDelegation = useCallback(
    async ({ form }) => {
      try {
        await _post(`/api/responsable/delegation`, {
          email: form.email,
          siret: formateur?.siret,
        });
        onClose();
        toast({
          title: "Délégation mise à jour",
          description: (
            <>
              La délégation de droit a été enregistrée pour le formateur{" "}
              <EtablissementLibelle etablissement={formateur} /> vers l'adresse courriel {form.email}
            </>
          ),
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
    [onClose, callback, formateur, toast]
  );

  const hasVoeux = relation.nombre_voeux > 0;

  const voeuxTelechargementsResponsable =
    relation.voeux_telechargements?.filter(
      (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
    ) ?? [];

  const voeuxTelecharges = !!voeuxTelechargementsResponsable.find(
    (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Déléguer le droit de réception de la liste de candidats pour{" "}
            <EtablissementLibelle etablissement={formateur} />
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Formik
            initialValues={{
              email: delegue?.email,
            }}
            validationSchema={emailConfirmationSchema}
            onSubmit={(form) => activateDelegation({ form })}
          >
            <Form style={{ width: "100%" }} id="delegation-form">
              <Text fontSize="lg" mb={4}>
                {hasVoeux && voeuxTelecharges ? (
                  <>
                    {/* Voeux disponibles et téléchargés par le responsable */}
                    Cette délégation de droits aura pour effet de réinitialiser le statut de téléchargement :
                    actuellement considérée comme déjà téléchargée pour cet établissement, la liste devra à nouveau être
                    téléchargée par la personne désignée. Votre téléchargement restera toutefois enregistré dans
                    l'historique. Vous conserverez un accès à ces listes et vous pourrez visualiser le statut
                    d'avancement de la personne désignée : confirmation d'adresse courriel, création du mot de passe,
                    téléchargement de la liste, téléchargement de l'éventuelle mise à jour.
                  </>
                ) : (
                  <>
                    {/* Pas de vœux ou vœux non téléchargés */}
                    Cette délégation vous dispensera, en tant qu'organisme responsable, de télécharger les listes de
                    vœux. Vous conserverez néanmoins un accès à ces listes et vous pourrez visualiser le statut
                    d'avancement de la personne désignée : confirmation d'adresse courriel, création du mot de passe,
                    téléchargement de la liste, téléchargement de l'éventuelle mise à jour.
                  </>
                )}
              </Text>
              <Alert mb={4}>
                <Text fontStyle="italic">
                  Attention : si vous souhaitez modifier votre email en tant que directeur d'organisme responsable,
                  habilité à accéder aux listes de tous les organismes formateurs, n'utilisez cette fonctionnalité, et
                  accédez à votre{" "}
                  <Link variant="action" href="/profil">
                    page profil
                  </Link>
                  .
                </Text>
              </Alert>
              <Text mb={4}>
                Après validation de cette délégation, le destinataire sera automatiquement informé par courriel, et
                devra procéder à la création de son mot de passe pour accéder à son espace de téléchargement. Si la
                personne ne reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
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
