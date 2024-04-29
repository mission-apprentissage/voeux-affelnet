import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Text, Link, Heading, Box, useDisclosure, Button, useToast, Spinner } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { _get, _put } from "../../../common/httpClient";
import { ResponsableLibelle } from "../../../common/components/responsable/fields/ResponsableLibelle";
import { UpdateResponsableEmailModal } from "../../../common/components/admin/modals/UpdateResponsableEmailModal";
import { History } from "../../responsable/History";
import { UserType } from "../../../common/constants/UserType";
import { UserStatut } from "../../../common/constants/UserStatut";
import { ResponsableStatut } from "../../../common/components/admin/fields/ResponsableStatut";

export const Responsable = () => {
  const mounted = useRef(false);
  const toast = useToast();

  const {
    onOpen: onOpenUpdateResponsableEmailModal,
    isOpen: isOpenUpdateResponsableEmailModal,
    onClose: onCloseUpdateResponsableEmailModal,
  } = useDisclosure();

  const { siret } = useParams();

  const [responsable, setResponsable] = useState(undefined);
  const [loadingResponsable, setLoadingResponsable] = useState(false);

  const getResponsable = useCallback(async () => {
    try {
      setLoadingResponsable(true);
      const response = await _get(`/api/admin/responsables/${siret}`);
      setResponsable(response);
      setLoadingResponsable(false);
    } catch (error) {
      setResponsable(undefined);
      setLoadingResponsable(false);
      throw Error;
    }
  }, [siret]);

  const reload = useCallback(async () => {
    await getResponsable();
  }, [getResponsable]);

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/responsables/${siret}/resendActivationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${responsable?.email}`,
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
  }, [siret, responsable, toast, reload]);

  const resendConfirmationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/responsables/${siret}/resendConfirmationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de confirmation de l'adresse courriel a été renvoyé à l'adresse ${responsable?.email}`,
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
  }, [siret, responsable, toast, reload]);

  // const resendNotificationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/admin/responsables/${siret}/resendNotificationEmail`);

  //     toast({
  //       title: "Courriel envoyé",
  //       description: `Le courriel de notification de listes téléchargeables a été renvoyé à l'adresse ${responsable?.email}`,
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
  // }, [siret, responsable, toast, reload]);

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

  if (loadingResponsable) {
    return <Spinner />;
  }

  if (!responsable) {
    return;
  }

  // const isResponsableFormateurForAtLeastOneEtablissement = !!responsable?.relations?.find(
  //   (relation) =>
  //     relation?.etablissement_formateur.uai === formateur?.uai ||
  //     relation?.etablissement_responsable.siret === responsable?.siret
  // );

  return (
    <Page
      title={
        <>
          Organisme responsable :&nbsp;
          <ResponsableLibelle responsable={responsable} />
        </>
      }
    >
      <Box my={12}>
        <Box mb={12}>
          <Text mb={4}>
            Adresse : {responsable?.adresse} - Siret : {responsable?.siret ?? "Inconnu"} - UAI :{" "}
            {responsable?.uai ?? "Inconnu"}
          </Text>

          <Text mb={4}>
            Email de direction enregistré : <strong>{responsable?.email}</strong>.{" "}
          </Text>

          {(responsable?.relations?.length === 1 &&
            responsable?.relations[0]?.etablissement_formateur.uai !== responsable?.uai) ||
            (responsable?.relations?.length > 1 && (
              <Text mb={4}>
                L'organisme est responsable de l'offre de {responsable?.relations?.length} organisme
                {responsable?.relations?.length > 1 && "s"} formateur
                {responsable?.relations?.length > 1 && "s"}.{" "}
                <Link variant="action" href={`/admin/responsable/${responsable?.siret}/formateurs`}>
                  Accéder à la liste
                </Link>
              </Text>
            ))}

          {/* {isResponsableFormateurForAtLeastOneEtablissement && (
            <Text mb={4}>
              L'organisme dispense directement des formations.{" "}
              <Link variant="action" href={`/admin/responsable/${responsable?.siret}/formateur/${formateur?.uai}`}>
                Accéder à la page de téléchargement des listes de candidats
              </Link>
            </Text>
          )} */}

          <Button variant="primary" onClick={onOpenUpdateResponsableEmailModal}>
            Modifier l'adresse courriel
          </Button>
        </Box>

        <Box mb={12} id="statut">
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          <Box mb={4}>
            <Box display={"inline-flex"}>
              <Box mr={2} display="inline-flex">
                <ResponsableStatut responsable={responsable} />.
              </Box>

              {UserType.RESPONSABLE === responsable?.type &&
                (() => {
                  switch (true) {
                    case UserStatut.EN_ATTENTE === responsable?.statut &&
                      !!responsable?.emails.filter((email) => email.templateName === "confirmation_responsable").length:
                      return (
                        <Link variant="action" onClick={resendConfirmationEmail}>
                          Générer un nouvel envoi de notification
                        </Link>
                      );
                    case UserStatut.CONFIRME === responsable?.statut &&
                      !!responsable?.emails.filter((email) => email.templateName === "activation_responsable").length:
                      return (
                        <Link variant="action" onClick={resendActivationEmail}>
                          Générer un nouvel envoi de notification
                        </Link>
                      );
                    // case UserStatut.ACTIVE === responsable?.statut:
                    //   return (
                    //     <Link variant="action" onClick={resendNotificationEmail}>
                    //       Générer un nouvel envoi de notification
                    //     </Link>
                    //   );
                    default:
                      return <></>;
                  }
                })()}
            </Box>
          </Box>

          <Heading as="h4" size="sm" mb={4}>
            Nombre de candidats: {responsable?.nombre_voeux.toLocaleString()}
          </Heading>

          <Text mb={4}>
            <Link variant="action" href={`/admin/responsable/${responsable?.siret}/formateurs`}>
              Voir la liste des organismes formateurs
            </Link>{" "}
            pour accéder aux listes de candidats disponibles et à leurs statuts de téléchargement.
          </Text>
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>

          <History responsable={responsable} />
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateResponsableEmailModal
          isOpen={isOpenUpdateResponsableEmailModal}
          onClose={onCloseUpdateResponsableEmailModal}
          callback={reload}
          responsable={responsable}
        />
      </Box>
    </Page>
  );
};

export default Responsable;
