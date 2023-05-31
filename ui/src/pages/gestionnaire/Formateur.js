import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { Page } from "../../common/components/layout/Page";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  Box,
  Button,
  Heading,
  Link,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { useDownloadVoeux } from "../../common/hooks/gestionnaireHooks";
import { _put } from "../../common/httpClient";
import { DelegationModal } from "../../common/components/gestionnaire/modals/DelegationModal";
import { UpdateDelegationModal } from "../../common/components/gestionnaire/modals/UpdateDelegationModal";
import { ErrorWarningLine } from "../../theme/components/icons/ErrorWarningLine";
import { SuccessLine } from "../../theme/components/icons";
import { UpdateGestionnaireEmailModal } from "../../common/components/gestionnaire/modals/UpdateGestionnaireEmailModal";
import { GestionnaireEmail } from "../../common/components/gestionnaire/fields/GestionnaireEmail";
import { History } from "./History";
import { isResponsableFormateur } from "../../common/utils/getUserType";
import { FormateurStatut } from "../../common/components/gestionnaire/fields/FormateurStatut";
import { UserType } from "../../common/constants/UserType";
import { UserStatut } from "../../common/constants/UserStatut";

export const Formateur = ({ gestionnaire, formateurs, callback }) => {
  const { uai } = useParams();
  const toast = useToast();

  const formateur = formateurs?.find((formateur) => formateur?.uai === uai);

  const etablissement = gestionnaire?.etablissements?.find((etablissement) => etablissement.uai === formateur?.uai);

  const downloadVoeux = useDownloadVoeux({ gestionnaire, formateur });

  const cancelDelegation = useCallback(async () => {
    await _put(`/api/gestionnaire/formateurs/${formateur.uai}`, { diffusionAutorisee: false });
  }, [formateur]);

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/gestionnaire/formateurs/${formateur.uai}/resendActivationEmail`);

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
  }, [formateur, etablissement, toast, callback]);

  const resendNotificationEmail = useCallback(async () => {
    try {
      await _put(`/api/gestionnaire/formateurs/${formateur.uai}/resendNotificationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de notification de liste de candidats disponible a été renvoyé à l'adresse ${formateur.email}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      await callback();
    } catch (error) {
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel de notification. Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [formateur, toast, callback]);

  const cancelDelegationAndDownloadVoeux = useCallback(async () => {
    await cancelDelegation();
    await downloadVoeux();
    await callback?.();
  }, [cancelDelegation, downloadVoeux, callback]);

  const downloadVoeuxAndReload = useCallback(async () => {
    await downloadVoeux();
    await callback();
  }, [downloadVoeux, callback]);

  const {
    onOpen: onOpenDelegationModal,
    isOpen: isOpenDelegationModal,
    onClose: onCloseDelegationModal,
  } = useDisclosure();

  const {
    onOpen: onOpenUpdateDelegationModal,
    isOpen: isOpenUpdateDelegationModal,
    onClose: onCloseUpdateDelegationModal,
  } = useDisclosure();

  const {
    onOpen: onOpenUpdateGestionnaireEmailModal,
    isOpen: isOpenUpdateGestionnaireEmailModal,
    onClose: onCloseUpdateGestionnaireEmailModal,
  } = useDisclosure();

  if (!gestionnaire) {
    return <>Un problème est survenu lors de la récupération du responsable</>;
  }

  if (!formateur) {
    return <>Nous n'avons pas trouvé le formateur. </>;
  }

  const isDiffusionAutorisee = etablissement?.diffusionAutorisee;

  const hasVoeux = etablissement.nombre_voeux > 0;

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements.filter(
    (telechargement) => telechargement.siret === gestionnaire.siret
  );

  const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  const voeuxTelechargesAtLeastOnce = !isDiffusionAutorisee
    ? !!voeuxTelechargementsGestionnaire.find(
        (telechargement) =>
          new Date(telechargement.date).getTime() >= new Date(etablissement.first_date_voeux).getTime()
      )
    : !!voeuxTelechargementsFormateur?.find(
        (telechargement) =>
          new Date(telechargement.date).getTime() >= new Date(etablissement.first_date_voeux).getTime()
      );

  const voeuxTelecharges = !isDiffusionAutorisee
    ? !!voeuxTelechargementsGestionnaire.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
      )
    : !!voeuxTelechargementsFormateur.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
      );
  const hasUpdatedVoeux = voeuxTelechargesAtLeastOnce && !voeuxTelecharges;

  const isResponsableFormateurCheck = isResponsableFormateur({ gestionnaire, formateur });

  const lastEmailDate =
    formateur.emails && typeof formateur.emails.findLast === "function"
      ? new Date(formateur.emails?.findLast(() => true)?.sendDates?.findLast(() => true))
      : null;

  return (
    <>
      <Page title={"Accès aux listes de candidats ayant exprimé des vœux sur le service en ligne affectation"}>
        <Box mb={4}>
          <Heading as="h3" size="md" mb={4}>
            Organisme {isResponsableFormateurCheck ? <>responsable-formateur</> : <>formateur</>} :&nbsp;
            <FormateurLibelle formateur={formateur} />
          </Heading>
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
              Personne habilitée à réceptionner les listes : <GestionnaireEmail gestionnaire={gestionnaire} />.{" "}
              <Link variant="action" onClick={onOpenUpdateGestionnaireEmailModal}>
                Modifier l'adresse courriel
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
                  : {gestionnaire.raison_sociale}
                </Text>
                <Text mb={2}>
                  Adresse : {gestionnaire.adresse ?? "Inconnue"} – Siret : {gestionnaire.siret ?? "Inconnu"} – UAI :{" "}
                  {gestionnaire.uai ?? "Inconnu"}
                </Text>
                <Text mb={2}>
                  Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
                  <GestionnaireEmail gestionnaire={gestionnaire} />
                </Text>
                <Text mb={2}>
                  <Link variant="action" href="/gestionnaire">
                    Accéder à la page de l'organisme responsable
                  </Link>
                </Text>
                <Text mb={2}>
                  <Link variant="action" href="/gestionnaire/formateurs">
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
                  Personne habilitée à réceptionner les listes au sein de l'organisme formateur : {etablissement?.email}{" "}
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
                  Activer la délégation de droits
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
                  <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} callback={callback} />.
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
                      //       Générer un nouvel envoi de notification
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
            {hasUpdatedVoeux ? (
              <>
                Une liste mise à jour de {etablissement.nombre_voeux} candidat
                {etablissement.nombre_voeux > 1 ? "s" : ""} est disponible pour cet établissement.
              </>
            ) : (
              <>Nombre de candidats: {etablissement.nombre_voeux}</>
            )}
          </Heading>

          {hasVoeux ? (
            <>
              <Text mb={4}>
                Date de mise à disposition : {new Date(etablissement.first_date_voeux).toLocaleDateString()}{" "}
                {etablissement.last_date_voeux !== etablissement.first_date_voeux && (
                  <>| Dernière mise à jour : {new Date(etablissement.last_date_voeux).toLocaleDateString()}</>
                )}
              </Text>
              {hasUpdatedVoeux && (
                <Text mb={4}>
                  Cette mise à jour peut comporter de nouveaux candidats, des suppressions, ou des mises à jour.
                </Text>
              )}
              {isDiffusionAutorisee ? (
                <>
                  {voeuxTelecharges ? (
                    <>
                      <Text display={"flex"} alignItems="center" mb={4}>
                        <SuccessLine verticalAlign="text-bottom" height="20px" width="20px" mr={2} /> Le destinataire (
                        {etablissement.email}) a bien téléchargé la liste de candidats.{" "}
                      </Text>
                      <Text>
                        Si une mise à jour de cette liste est disponible, l'utilisateur en sera notifié par courriel.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text display={"flex"} alignItems="center" mb={4}>
                        <ErrorWarningLine mr={2} /> Vœux non téléchargés
                      </Text>
                      <Text>
                        Vous avez autorisé les droits de diffusion directe à {etablissement.email}, mais cette personne
                        n'a pas encore téléchargé la liste (
                        <Link href="#history" variant="action">
                          voir l'historique ci-dessous
                        </Link>
                        )
                      </Text>
                    </>
                  )}
                </>
              ) : (
                <>
                  {voeuxTelecharges ? (
                    <Text display={"flex"} alignItems="center" mb={4}>
                      <SuccessLine verticalAlign="text-bottom" height="20px" width="20px" mr={2} /> Liste téléchargée
                      par vous ({gestionnaire.email}
                      ). &nbsp;
                      <Link variant="action" onClick={downloadVoeuxAndReload}>
                        Télécharger à nouveau
                      </Link>
                    </Text>
                  ) : (
                    <>
                      <Button variant="primary" mb={4} onClick={downloadVoeuxAndReload}>
                        Télécharger la liste
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          ) : new Date().getTime() <= new Date("2023/06/05").getTime() ? (
            <>
              <Text mb={4}>
                Les vœux exprimés en mai seront rendus disponibles dans la semaine du 5 juin 2023. Un courriel vous
                préviendra de la mise à disposition des listes.
              </Text>
            </>
          ) : (
            <>
              <Text mb={4}>
                Aucun vœu n’a été exprimé pour cet organisme sur la période de formulation des demandes (du 9 au 30
                mai).
              </Text>
              <Text mb={4}>
                Si vous pensez qu’il s’agit d’une anomalie, vous pouvez{" "}
                <Link href="/support" variant="action">
                  transmettre un signalement
                </Link>
                .
              </Text>
              <Text mb={4}>
                Une mise à jour pourra être communiquée la semaine du 19 juin, pour prendre les éventuels ajouts. Une
                notification courriel sera alors envoyée.
              </Text>
            </>
          )}
        </Box>

        {isDiffusionAutorisee && hasVoeux && !voeuxTelecharges && (
          <Box mb={12}>
            <Heading as="h3" size="md" mb={4}>
              Que souhaitez-vous faire ?
            </Heading>

            <Accordion defaultIndex={[]} allowToggle>
              <AccordionItem mb={0}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Je souhaite que l'organisme formateur télécharge la liste
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    Prenez contact avec la personne destinataire pour l'inviter à télécharger la liste. Si la personne
                    n'a pas reçu d'email de notification invitez-la à consulter ses spam, en lui communiquant la date à
                    laquelle la dernière notification lui a été envoyée ({lastEmailDate?.toLocaleDateString()}) et
                    l'expéditeur des notifications ({process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}).
                  </Text>
                  <Text mb={4}>
                    Si malgré tout la personne ne retrouve pas la notification, vous pouvez essayer de{" "}
                    {(() => {
                      switch (true) {
                        case UserStatut.CONFIRME === formateur.statut:
                          return (
                            <Link variant="action" onClick={resendActivationEmail}>
                              générer un nouvel envoi de notification courriel
                            </Link>
                          );
                        case UserStatut.ACTIVE === formateur.statut:
                          return (
                            <Link variant="action" onClick={resendNotificationEmail}>
                              générer un nouvel envoi de notification courriel
                            </Link>
                          );
                        default:
                          return <></>;
                      }
                    })()}
                    .
                  </Text>
                  <Text mb={4}>
                    Vous pouvez également{" "}
                    <Link variant="action" onClick={onOpenUpdateDelegationModal}>
                      modifier l'email de la personne habilitée
                    </Link>
                    .
                  </Text>
                  <Text mb={4}>
                    En cas de problème,{" "}
                    <Link href="/support" variant="action">
                      vous pouvez signaler une anomalie à l'équipe technique
                    </Link>
                    .
                  </Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem mb={0}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Je télécharge la liste et je la transférerai par mes propres moyens à l'organisme responsable
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    En procédant à ce téléchargement, vous annulez la délégation de droits précédemment accordée à{" "}
                    {etablissement.email}. Vous devrez vous assurer par vos propres moyens que les jeunes ayant exprimé
                    leurs vœux fassent l'objet d'une réponse rapide.
                  </Text>

                  <Button variant="primary" mb={4} onClick={cancelDelegationAndDownloadVoeux}>
                    Télécharger la liste
                  </Button>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem mb={0}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Je télécharge la liste mais je souhaite que {etablissement.email} la télécharge également
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    En procédant à ce téléchargement, la délégation accordée à {etablissement.email} reste en vigueur.
                  </Text>
                  <Text mb={4}>
                    La liste restera considérée comme non téléchargée jusqu'à ce que {etablissement.email} procède au
                    téléchargement : prenez contact avec la personne destinataire pour l'inviter à télécharger la liste.
                    Si la personne n'a pas reçu d'email de notification invitez-la à consulter ses spam, en lui
                    communiquant la date à laquelle la dernière notification lui a été envoyée (
                    {lastEmailDate?.toLocaleDateString()}) et l'expéditeur des notifications (
                    {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}).
                  </Text>
                  <Text mb={4}>
                    Si malgré tout la personne ne retrouve pas la notification, vous pouvez essayer de{" "}
                    {(() => {
                      switch (true) {
                        case UserStatut.CONFIRME === formateur.statut:
                          return (
                            <Link variant="action" onClick={resendActivationEmail}>
                              générer un nouvel envoi de notification courriel
                            </Link>
                          );
                        case UserStatut.ACTIVE === formateur.statut:
                          return (
                            <Link variant="action" onClick={resendNotificationEmail}>
                              générer un nouvel envoi de notification courriel
                            </Link>
                          );
                        default:
                          return <></>;
                      }
                    })()}
                    .
                  </Text>
                  <Text mb={4}>
                    Vous pouvez également{" "}
                    <Link variant="action" onClick={onOpenUpdateDelegationModal}>
                      modifier l'email de la personne habilitée
                    </Link>
                    .
                  </Text>
                  <Button variant="primary" mb={4} onClick={downloadVoeuxAndReload}>
                    Télécharger la liste
                  </Button>
                  <Text mb={4}>
                    En cas de problème,{" "}
                    <Link href="/support" variant="action">
                      vous pouvez signaler une anomalie à l'équipe technique
                    </Link>
                    .
                  </Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        )}

        <Box mb={12}>
          <Link variant="action" href="/ymag-ou-igesti">
            Utilisateur Ymag ou IGesti ?
          </Link>
        </Box>

        <Box mb={8} id="history">
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>

          {isResponsableFormateurCheck ? (
            <History gestionnaire={gestionnaire} formateur={formateur} />
          ) : (
            <History formateur={formateur} />
          )}
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>
      </Page>
    </>
  );
};
