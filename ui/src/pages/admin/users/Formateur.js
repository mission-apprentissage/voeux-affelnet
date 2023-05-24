import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Text, Link, Heading, Box, Alert, useDisclosure, Button, useToast } from "@chakra-ui/react";

import { _get, _put } from "../../../common/httpClient";
import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { isResponsableFormateur } from "../../../common/utils/getUserType";
import { useDownloadVoeux } from "../../../common/hooks/adminHooks";
import { History } from "../../gestionnaire/History";
import { UpdateDelegationModal } from "../../../common/components/admin/modals/UpdateDelegationModal";
import { DelegationModal } from "../../../common/components/admin/modals/DelegationModal";
import { UpdateGestionnaireEmailModal } from "../../../common/components/admin/modals/UpdateGestionnaireEmailModal";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { UserType } from "../../../common/constants/UserType";
import { UserStatut } from "../../../common/constants/UserStatut";

export const Formateur = () => {
  const navigate = useNavigate();

  const {
    onOpen: onOpenUpdateGestionnaireEmailModal,
    isOpen: isOpenUpdateGestionnaireEmailModal,
    onClose: onCloseUpdateGestionnaireEmailModal,
  } = useDisclosure();

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

  const { siret, uai } = useParams();
  const downloadVoeux = useDownloadVoeux();
  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [formateur, setFormateur] = useState(undefined);
  const mounted = useRef(false);
  const toast = useToast();

  const getGestionnaire = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/gestionnaires/${siret}`);
      setGestionnaire(response);
    } catch (error) {
      setGestionnaire(undefined);
      throw Error;
    }
  }, [siret]);

  const getFormateur = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/formateurs/${uai}`);

      setFormateur(response);
    } catch (error) {
      setFormateur(undefined);
      throw Error;
    }
  }, [uai]);

  const callback = useCallback(async () => {
    await getFormateur();
    await getGestionnaire();
  }, [getFormateur, getGestionnaire]);

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
      navigate(`/admin/formateur/${uai}/gestionnaires`, { replace: true });
    }
  }, [siret, navigate, uai]);

  const isResponsableFormateurCheck = isResponsableFormateur({
    gestionnaire,
    formateur,
  });

  const etablissement = gestionnaire?.etablissements?.find((etablissement) => etablissement.uai === formateur.uai);

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/formateurs/${uai}/resendActivationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${
          formateur.email ?? etablissement.email
        }`,
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
  }, [uai, formateur, etablissement, toast, callback]);

  if (!gestionnaire) {
    return (
      <>
        Un problème est survenu lors de la récupération du responsable.{" "}
        <Link variant="action" href="/support">
          Signaler un problème
        </Link>
      </>
    );
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

  if (!etablissement) {
    return;
  }

  const isDiffusionAutorisee = !!etablissement?.diffusionAutorisee;

  const hasVoeux = etablissement?.nombre_voeux > 0;

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
          Adresse : {formateur.adresse} – Siret : {formateur.siret ?? "Inconnu"} – UAI : {formateur.uai ?? "Inconnu"}
        </Text>
      </Box>

      {isResponsableFormateurCheck ? (
        <Box mb={12}>
          <Text mb={4}>
            Cet organisme formateur est également responsable (signataire des conventions de formation), directement
            habilité à accéder aux listes de candidats.
          </Text>
          <Text mb={4}>
            Personne habilitée à réceptionner les listes : {gestionnaire.email}.{" "}
            <Link variant="action" onClick={onOpenUpdateGestionnaireEmailModal}>
              (modifier)
            </Link>
          </Text>

          <UpdateGestionnaireEmailModal
            isOpen={isOpenUpdateGestionnaireEmailModal}
            onClose={onCloseUpdateGestionnaireEmailModal}
            callback={callback}
            gestionnaire={gestionnaire}
          />
        </Box>
      ) : (
        <Box mb={12}>
          <Alert status="info" variant="left-accent" my={6}>
            <Box>
              <Text mb={2}>
                <Text as="b" style={{ textDecoration: "underline" }}>
                  Organisme responsable
                </Text>{" "}
                : {gestionnaire?.raison_sociale}
              </Text>
              <Text mb={2}>
                Adresse : {gestionnaire?.adresse ?? "Inconnue"} – Siret : {gestionnaire?.siret ?? "Inconnu"} – UAI :{" "}
                {gestionnaire?.uai ?? "Inconnu"}
              </Text>
              <Text mb={2}>
                Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
                {gestionnaire?.email}
              </Text>
              <Text mb={2}>
                <Link variant="action" href={`/admin/gestionnaire/${gestionnaire?.siret}  `}>
                  Accéder à la page de l'organisme responsable
                </Link>
              </Text>
              <Text mb={2}>
                <Link variant="action" href={`/admin/gestionnaire/${gestionnaire?.siret}/formateurs`}>
                  Accéder à la liste des formateurs dépendants de cet organisme responsable
                </Link>
              </Text>
            </Box>
          </Alert>

          {isDiffusionAutorisee ? (
            <>
              <Text mb={4}>
                La délégation des droits de réception des listes de candidats a été activée pour cet organisme
                formateur.{" "}
              </Text>
              <Text mb={4}>
                Personne habilitée à réceptionner les listes au sein de l'organisme formateur :{" "}
                {formateur?.email ?? etablissement?.email}{" "}
                <Link variant="action" onClick={onOpenUpdateDelegationModal}>
                  (modifier)
                </Link>
              </Text>

              <UpdateDelegationModal
                gestionnaire={gestionnaire}
                formateur={formateur}
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
                gestionnaire={gestionnaire}
                formateur={formateur}
                callback={callback}
                isOpen={isOpenDelegationModal}
                onClose={onCloseDelegationModal}
              />
            </>
          )}
        </Box>
      )}

      <Box mb={12} id="statut">
        <Heading as="h3" size="md" mb={4}>
          Statut
        </Heading>

        {(isDiffusionAutorisee || isResponsableFormateurCheck) && (
          <Box mb={4}>
            <Text display={"inline-flex"}>
              <Box mr={2} display="inline-flex">
                <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} />.
              </Box>

              {UserType.FORMATEUR === formateur.type &&
                (() => {
                  switch (true) {
                    case UserStatut.CONFIRME === formateur.statut:
                      return (
                        <Link variant="action" onClick={resendActivationEmail}>
                          Générer un nouvel envoi de notification
                        </Link>
                      );
                    // case UserStatut.ACTIVE === formateur.statut:
                    //   return (
                    //     <Link variant="action" onClick={resendNotificationEmail}>
                    // Générer un nouvel envoi de notification
                    //       {gestionnaire.emails?.find((email) => email.templateName.startsWith("notification_"))
                    //         ? "Renvoyer l'email de notification de disponibilité des listes"
                    //         : "Envoyer l'email de notification de disponibilité des listes"}
                    //     </Link>
                    //   );
                    default:
                      return <></>;
                  }
                })()}
            </Text>
          </Box>
        )}

        <Heading as="h4" size="sm" mb={4}>
          Nombre de candidats: {gestionnaire.nombre_voeux ?? formateur.nombre_voeux}
        </Heading>

        {hasVoeux && (
          <Link variant="action" onClick={() => downloadVoeux({ gestionnaire, formateur })}>
            Télécharger la liste
          </Link>
        )}
      </Box>

      <Box mb={12}>
        <Heading as="h3" size="md" mb={4}>
          Historique des actions
        </Heading>

        <History formateur={formateur} />
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
