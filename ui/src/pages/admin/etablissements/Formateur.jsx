import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Text, Link, Heading, Box, Alert, useDisclosure, Button, useToast, Spinner } from "@chakra-ui/react";

import { _get, _put } from "../../../common/httpClient";
import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { isResponsableFormateur } from "../../../common/utils/getUserType";
import { useDownloadVoeux } from "../../../common/hooks/adminHooks";
import { History } from "../../responsable/History";
import { UpdateDelegationModal } from "../../../common/components/admin/modals/UpdateDelegationModal";
import { DelegationModal } from "../../../common/components/admin/modals/DelegationModal";
// import { UpdateResponsableEmailModal } from "../../../common/components/admin/modals/UpdateResponsableEmailModal";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { UserStatut } from "../../../common/constants/UserStatut";
import { FormateurEmail } from "../../../common/components/admin/fields/FormateurEmail";

export const Formateur = () => {
  const mounted = useRef(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { siret, uai } = useParams();

  // const {
  //   onOpen: onOpenUpdateResponsableEmailModal,
  //   isOpen: isOpenUpdateResponsableEmailModal,
  //   onClose: onCloseUpdateResponsableEmailModal,
  // } = useDisclosure();

  const {
    onOpen: onOpenUpdateDelegationModal,
    isOpen: isOpenUpdateDelegationModal,
    onClose: onCloseUpdateDelegationModal,
  } = useDisclosure();

  const {
    onOpen: onOpenDelegationModal,
    isOpen: isOpenDelegationModal,
    onClose: onCloseDelegationModal,
  } = useDisclosure();

  const downloadVoeux = useDownloadVoeux();
  const [formateur, setFormateur] = useState(undefined);
  const [loadingFormateur, setLoadingFormateur] = useState(false);

  const getFormateur = useCallback(async () => {
    try {
      setLoadingFormateur(true);
      const response = await _get(`/api/admin/formateurs/${uai}`);

      setLoadingFormateur(false);
      setFormateur(response);
    } catch (error) {
      setFormateur(undefined);
      setLoadingFormateur(false);
      throw Error;
    }
  }, [uai]);

  const relation = formateur?.relations?.find(
    (relation) => relation.etablissement_responsable.siret === siret && relation.etablissement_formateur.uai === uai
  );

  const responsable = relation?.responsable;

  const delegue = relation?.delegue;

  const callback = useCallback(async () => {
    await Promise.all([await getFormateur()]);
  }, [getFormateur]);

  useEffect(() => {
    const run = async () => {
      if (!mounted.current) {
        mounted.current = true;
        callback();
      }
    };
    run();
  }, [callback]);

  useEffect(() => {
    if (!siret) {
      navigate(`/admin/formateur/${uai}/responsables`, { replace: true });
    }
  }, [siret, navigate, uai]);

  const isResponsableFormateurCheck = isResponsableFormateur({
    responsable,
    formateur,
  });

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/delegues/${siret}/${uai}/resendActivationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${delegue?.email}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      await callback();
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
  }, [siret, uai, delegue, toast, callback]);

  const resendNotificationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/delegues/${siret}/${uai}/resendNotificationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de notification de listes téléchargeables a été renvoyé à l'adresse ${delegue?.email}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      await callback();
    } catch (error) {
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel de notification de listes téléchargeables . Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [siret, uai, delegue, toast, callback]);

  if (loadingFormateur) {
    return <Spinner />;
  }

  if (!formateur) {
    return (
      <>
        Nous n'avons pas trouvé le formateur.{" "}
        <Link variant="action" href="/support">
          Signaler un problème
        </Link>
      </>
    );
  }

  if (!responsable) {
    return (
      <>
        Un problème est survenu lors de la récupération du responsable.{" "}
        <Link variant="action" href="/support">
          Signaler un problème
        </Link>
      </>
    );
  }

  const isDiffusionAutorisee = !!delegue;

  const hasVoeux = relation?.nombre_voeux > 0;

  return (
    <Page
      title={
        <>
          Organisme {isResponsableFormateurCheck ? <>responsable-formateur</> : <>formateur</>} :&nbsp;
          <FormateurLibelle formateur={formateur} />
        </>
      }
    >
      <Box my={6}>
        <Text mb={4}>
          Adresse : {formateur?.adresse} – Siret : {formateur?.siret ?? "Inconnu"} – UAI : {formateur?.uai ?? "Inconnu"}
        </Text>
      </Box>
      {/*
      {isResponsableFormateurCheck ? (
        <Box mb={12}>
          <Text mb={4}>
            Cet organisme formateur est également responsable (signataire des conventions de formation), directement
            habilité à accéder aux listes de candidats.
          </Text>
          <Text mb={4}>
            Personne habilitée à réceptionner les listes : {responsable?.email}{" "}
            <Link variant="action" onClick={onOpenUpdateResponsableEmailModal}>
              (modifier)
            </Link>
          </Text>

          <UpdateResponsableEmailModal
            isOpen={isOpenUpdateResponsableEmailModal}
            onClose={onCloseUpdateResponsableEmailModal}
            callback={callback}
            responsable={responsable}
          />
        </Box>
      ) : ( */}
      <Box mb={12}>
        <Alert status="info" variant="left-accent" my={6}>
          <Box>
            <Text mb={2}>
              <Text as="b" style={{ textDecoration: "underline" }}>
                Organisme responsable
              </Text>{" "}
              : {responsable?.raison_sociale}
            </Text>
            <Text mb={2}>
              Adresse : {responsable?.adresse ?? "Inconnue"} – Siret : {responsable?.siret ?? "Inconnu"} – UAI :{" "}
              {responsable?.uai ?? "Inconnu"}
            </Text>
            <Text mb={2}>
              Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
              {responsable?.email}
            </Text>
            <Text mb={2}>
              <Link variant="action" href={`/admin/responsable/${responsable?.siret}  `}>
                Accéder à la page de l'organisme responsable
              </Link>
            </Text>
            <Text mb={2}>
              <Link variant="action" href={`/admin/responsable/${responsable?.siret}/formateurs`}>
                Accéder à la liste des formateurs dépendants de cet organisme responsable
              </Link>
            </Text>
          </Box>
        </Alert>

        {isDiffusionAutorisee ? (
          <>
            <Text mb={4}>
              La délégation des droits de réception des listes de candidats a été activée pour cet organisme formateur.{" "}
            </Text>
            <Text mb={4}>
              Personne habilitée à réceptionner les listes au sein de l'organisme formateur :{" "}
              <FormateurEmail responsable={responsable} formateur={formateur} delegue={delegue} />{" "}
              <Link variant="action" onClick={onOpenUpdateDelegationModal}>
                (modifier)
              </Link>
            </Text>

            <UpdateDelegationModal
              relation={relation}
              callback={callback}
              isOpen={isOpenUpdateDelegationModal}
              onClose={onCloseUpdateDelegationModal}
            />
          </>
        ) : (
          <>
            <Text mb={4}>
              La délégation des droits de réception des listes de candidats n'a pas été activée pour cet organisme
              formateur. Seul le responsable peut les réceptionner.
            </Text>

            <Button variant="primary" mb={4} onClick={onOpenDelegationModal}>
              Définir une délégation de droits pour cet organisme
            </Button>

            <DelegationModal
              relation={relation}
              callback={callback}
              isOpen={isOpenDelegationModal}
              onClose={onCloseDelegationModal}
            />
          </>
        )}
      </Box>
      {/* )} */}

      <Box mb={12} id="statut">
        <Heading as="h3" size="md" mb={4}>
          Statut
        </Heading>

        <Box mb={4}>
          <Text display={"inline-flex"}>
            <Box mr={2} display="inline-flex">
              <FormateurStatut relation={relation} />.
            </Box>
            {isDiffusionAutorisee /*|| isResponsableFormateurCheck*/ &&
              (() => {
                switch (true) {
                  case UserStatut.CONFIRME === delegue.statut &&
                    !!delegue.emails.filter((email) => email.templateName === "activation_delegue").length:
                    return (
                      <Link variant="action" onClick={resendActivationEmail}>
                        Générer un nouvel envoi de notification
                      </Link>
                    );
                  case UserStatut.ACTIVE === delegue.statut &&
                    hasVoeux &&
                    !!delegue.emails.filter((email) => email.templateName === "notification_delegue").length:
                    return (
                      <Link variant="action" onClick={resendNotificationEmail}>
                        Générer un nouvel envoi de notification
                      </Link>
                    );
                  default:
                    return <></>;
                }
              })()}
          </Text>
        </Box>

        <Heading as="h4" size="sm" mb={4}>
          Nombre de candidats: {relation.nombre_voeux.toLocaleString()}
        </Heading>

        {hasVoeux && (
          <Link variant="action" onClick={() => downloadVoeux({ responsable, formateur })}>
            Télécharger la liste
          </Link>
        )}
      </Box>

      <Box mb={12}>
        <Heading as="h3" size="md" mb={4}>
          Historique des actions
        </Heading>

        <History
          formateur={formateur}
          responsable={isResponsableFormateurCheck ? responsable : undefined}
          delegue={delegue}
          relation={relation}
        />
      </Box>

      <Box mb={12}>
        <Link href="/support" variant="action">
          Signaler une anomalie
        </Link>
      </Box>
    </Page>
  );
};

export default Formateur;
