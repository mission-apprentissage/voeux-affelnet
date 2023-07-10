import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Text, Link, Heading, Box, useDisclosure, Button, useToast, Spinner } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { _get, _put } from "../../../common/httpClient";
import { GestionnaireLibelle } from "../../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { UpdateGestionnaireEmailModal } from "../../../common/components/admin/modals/UpdateGestionnaireEmailModal";
import { History } from "../../gestionnaire/History";
import { UserType } from "../../../common/constants/UserType";
import { UserStatut } from "../../../common/constants/UserStatut";
import { GestionnaireStatut } from "../../../common/components/admin/fields/GestionnaireStatut";

export const Gestionnaire = () => {
  const {
    onOpen: onOpenUpdateGestionnaireEmailModal,
    isOpen: isOpenUpdateGestionnaireEmailModal,
    onClose: onCloseUpdateGestionnaireEmailModal,
  } = useDisclosure();

  const { siret } = useParams();

  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [loadingGestionnaire, setLoadingGestionnaire] = useState(false);
  const mounted = useRef(false);
  const toast = useToast();

  const getGestionnaire = useCallback(async () => {
    try {
      setLoadingGestionnaire(true);
      const response = await _get(`/api/admin/gestionnaires/${siret}`);
      setGestionnaire(response);
      setLoadingGestionnaire(false);
    } catch (error) {
      setGestionnaire(undefined);
      setLoadingGestionnaire(false);
      throw Error;
    }
  }, [siret]);

  const reload = useCallback(async () => {
    await getGestionnaire();
  }, [getGestionnaire]);

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/gestionnaires/${siret}/resendActivationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${gestionnaire.email}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      await reload();
    } catch (error) {
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel d'activation. Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [siret, gestionnaire, toast, reload]);

  const resendConfirmationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/gestionnaires/${siret}/resendConfirmationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de confirmation de l'adresse courriel a été renvoyé à l'adresse ${gestionnaire.email}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      await reload();
    } catch (error) {
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel de confirmation. Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [siret, gestionnaire, toast, reload]);

  // const resendNotificationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/admin/gestionnaires/${siret}/resendNotificationEmail`);

  //     toast({
  //       title: "Courriel envoyé",
  //       description: `Le courriel de notification de listes téléchargeables a été renvoyé à l'adresse ${gestionnaire.email}`,
  //       status: "success",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //     await reload();
  //   } catch (error) {
  //     toast({
  //       title: "Impossible d'envoyer le courriel",
  //       description:
  //         "Une erreur est survenue lors de la tentative de renvoie du courriel de notification de listes téléchargeables . Veuillez contacter le support.",
  //       status: "error",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //   }
  // }, [siret, gestionnaire, toast, reload]);

  useEffect(() => {
    const run = async () => {
      if (!mounted.current) {
        await reload();
        mounted.current = true;
      }
    };
    run();

    return () => {
      mounted.current = false;
    };
  }, [reload]);

  if (loadingGestionnaire) {
    return <Spinner />;
  }

  if (!gestionnaire) {
    return;
  }

  const isResponsableFormateurForAtLeastOneEtablissement = !!gestionnaire?.etablissements?.find(
    (etablissement) => etablissement.uai === gestionnaire.uai || etablissement.siret === gestionnaire.siret
  );

  return (
    <Page
      title={
        <>
          Organisme responsable :&nbsp;
          <GestionnaireLibelle gestionnaire={gestionnaire} />
        </>
      }
    >
      <Box my={12}>
        <Box mb={12}>
          <Text mb={4}>
            Adresse : {gestionnaire.adresse} - Siret : {gestionnaire.siret ?? "Inconnu"} - UAI :{" "}
            {gestionnaire.uai ?? "Inconnu"}
          </Text>

          <Text mb={4}>
            Email de direction enregistré : <strong>{gestionnaire?.email}</strong>.{" "}
          </Text>

          {(gestionnaire?.etablissements?.length === 1 && gestionnaire.etablissements[0].uai !== gestionnaire.uai) ||
            (gestionnaire?.etablissements?.length > 1 && (
              <Text mb={4}>
                L'organisme est responsable de l'offre de {gestionnaire?.etablissements?.length} organisme
                {gestionnaire?.etablissements?.length > 1 && "s"} formateur
                {gestionnaire?.etablissements?.length > 1 && "s"}.{" "}
                <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateurs`}>
                  Accéder à la liste
                </Link>
              </Text>
            ))}

          {isResponsableFormateurForAtLeastOneEtablissement && (
            <Text mb={4}>
              L'organisme dispense directement des formations.{" "}
              <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateur/${gestionnaire.uai}`}>
                Accéder à la page de téléchargement des listes de candidats
              </Link>
            </Text>
          )}

          <Button variant="primary" onClick={onOpenUpdateGestionnaireEmailModal}>
            Modifier l'adresse courriel
          </Button>
        </Box>

        <Box mb={12} id="statut">
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          <Box mb={4}>
            <Text display={"inline-flex"}>
              <Box mr={2} display="inline-flex">
                <GestionnaireStatut gestionnaire={gestionnaire} />.
              </Box>

              {UserType.GESTIONNAIRE === gestionnaire.type &&
                (() => {
                  switch (true) {
                    case UserStatut.EN_ATTENTE === gestionnaire.statut:
                      return (
                        <Link variant="action" onClick={resendConfirmationEmail}>
                          Générer un nouvel envoi de notification
                        </Link>
                      );
                    case UserStatut.CONFIRME === gestionnaire.statut:
                      return (
                        <Link variant="action" onClick={resendActivationEmail}>
                          Générer un nouvel envoi de notification
                        </Link>
                      );
                    // case UserStatut.ACTIVE === gestionnaire.statut:
                    //   return (
                    //     <Link variant="action" onClick={resendNotificationEmail}>
                    //       Générer un nouvel envoi de notification
                    //     </Link>
                    //   );
                    default:
                      return <></>;
                  }
                })()}
            </Text>
          </Box>

          <Heading as="h4" size="sm" mb={4}>
            Nombre de candidats: {gestionnaire.nombre_voeux}
          </Heading>

          <Text mb={4}>
            <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateurs`}>
              Voir la liste des organismes formateurs
            </Link>{" "}
            pour accéder aux listes de candidats disponibles et à leurs statuts de téléchargement.
          </Text>
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>

          <History gestionnaire={gestionnaire} />
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateGestionnaireEmailModal
          isOpen={isOpenUpdateGestionnaireEmailModal}
          onClose={onCloseUpdateGestionnaireEmailModal}
          callback={reload}
          gestionnaire={gestionnaire}
        />
      </Box>
    </Page>
  );
};

export default Gestionnaire;
