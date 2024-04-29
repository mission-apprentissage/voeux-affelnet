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

import { useDownloadVoeux } from "../../common/hooks/responsableHooks";
import { _put, _delete } from "../../common/httpClient";
import { DelegationModal } from "../../common/components/responsable/modals/DelegationModal";
import { UpdateDelegationModal } from "../../common/components/responsable/modals/UpdateDelegationModal";
import { ErrorWarningLine } from "../../theme/components/icons/ErrorWarningLine";
import { SuccessLine } from "../../theme/components/icons";
import { UpdateResponsableEmailModal } from "../../common/components/responsable/modals/UpdateResponsableEmailModal";
import { ResponsableEmail } from "../../common/components/responsable/fields/ResponsableEmail";
import { History } from "./History";
import { isResponsableFormateur } from "../../common/utils/getUserType";
import { FormateurStatut } from "../../common/components/responsable/fields/FormateurStatut";
import { UserType } from "../../common/constants/UserType";
import { UserStatut } from "../../common/constants/UserStatut";
import { FormateurEmail } from "../../common/components/responsable/fields/FormateurEmail";

export const Formateur = ({ responsable, callback }) => {
  const { uai } = useParams();
  const toast = useToast();

  const relation = responsable?.relations?.find((relation) => relation.etablissement_formateur.uai === uai);
  // const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;
  const delegue = relation.delegue;

  const downloadVoeux = useDownloadVoeux({ responsable, formateur });

  const cancelDelegation = useCallback(async () => {
    await _delete(`/api/responsable/delegation`, {
      uai: formateur?.uai,
    });
  }, [formateur]);

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/responsable/formateurs/${formateur?.uai}/resendActivationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${delegue.email}`,
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
  }, [formateur, delegue, toast, callback]);

  const resendNotificationEmail = useCallback(async () => {
    try {
      await _put(`/api/responsable/formateurs/${formateur?.uai}/resendNotificationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de notification de liste de candidats disponible a été renvoyé à l'adresse ${formateur?.email}`,
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
    onOpen: onOpenUpdateResponsableEmailModal,
    isOpen: isOpenUpdateResponsableEmailModal,
    onClose: onCloseUpdateResponsableEmailModal,
  } = useDisclosure();

  if (!responsable) {
    return <>Un problème est survenu lors de la récupération du responsable</>;
  }

  if (!formateur) {
    return <>Nous n'avons pas trouvé le formateur. </>;
  }

  console.log({ responsable, formateur, delegue });

  // const isDiffusionAutorisee = etablissement?.diffusion_autorisee;
  const isDiffusionAutorisee = !!delegue;

  const hasVoeux = relation.nombre_voeux > 0;

  const voeuxTelechargementsDelegue =
    relation.voeux_telechargements?.filter((telechargement) => telechargement.userType === UserType.DELEGUE) ?? [];

  const voeuxTelechargementsResponsable =
    relation.voeux_telechargements?.filter((telechargement) => telechargement.userType === UserType.RESPONSABLE) ?? [];

  const voeuxTelechargesAtLeastOnce = !isDiffusionAutorisee
    ? !!voeuxTelechargementsResponsable.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.first_date_voeux).getTime()
      )
    : !!voeuxTelechargementsDelegue?.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.first_date_voeux).getTime()
      );

  const voeuxTelecharges = !isDiffusionAutorisee
    ? !!voeuxTelechargementsResponsable.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
      )
    : !!voeuxTelechargementsDelegue.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
      );
  const hasUpdatedVoeux = voeuxTelechargesAtLeastOnce && !voeuxTelecharges;

  const isResponsableFormateurCheck = false; // isResponsableFormateur({ responsable, formateur });

  const lastEmailDate =
    delegue?.emails && typeof delegue.emails.findLast === "function"
      ? new Date(delegue.emails?.findLast(() => true)?.sendDates?.findLast(() => true))
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
            Adresse : {formateur?.adresse} – Siret : {formateur?.siret ?? "Inconnu"} – UAI :{" "}
            {formateur?.uai ?? "Inconnu"}
          </Text>
        </Box>

        {isResponsableFormateurCheck ? (
          <Box mb={12}>
            <Text mb={4}>
              Cet organisme formateur est également responsable (signataire des conventions de formation), directement
              habilité à accéder aux listes de candidats.
            </Text>
            <Text mb={4}>
              Personne habilitée à réceptionner les listes : <ResponsableEmail responsable={responsable} />.{" "}
              <Link variant="action" onClick={onOpenUpdateResponsableEmailModal}>
                Modifier l'adresse courriel
              </Link>
            </Text>

            <UpdateResponsableEmailModal
              isOpen={isOpenUpdateResponsableEmailModal}
              onClose={onCloseUpdateResponsableEmailModal}
              callback={callback}
              responsable={responsable}
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
                  : {responsable?.raison_sociale}
                </Text>
                <Text mb={2}>
                  Adresse : {responsable?.adresse ?? "Inconnue"} – Siret : {responsable?.siret ?? "Inconnu"} – UAI :{" "}
                  {responsable?.uai ?? "Inconnu"}
                </Text>
                <Text mb={2}>
                  Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
                  <ResponsableEmail responsable={responsable} />
                </Text>
                <Text mb={2}>
                  <Link variant="action" href="/responsable">
                    Accéder à la page de l'organisme responsable
                  </Link>
                </Text>
                <Text mb={2}>
                  <Link variant="action" href="/responsable/formateurs">
                    Accéder à la liste des formateurs dépendants de cet organisme responsable
                  </Link>
                </Text>
              </Box>
            </Alert>

            {isDiffusionAutorisee ? (
              <>
                <Text mb={4}>
                  La délégation des droits de réception des listes de candidats a été activée pour cet organisme
                  formateur?.{" "}
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
                  Activer la délégation de droits
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
        )}

        <Box mb={12} id="statut">
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          {(isDiffusionAutorisee || isResponsableFormateurCheck) && (
            <Box mb={4}>
              <Text as="span">
                <Box mr={2} display="inline-flex">
                  <FormateurStatut relation={relation} callback={callback} />.
                </Box>

                {UserType.DELEGUE === delegue.type &&
                  (() => {
                    switch (true) {
                      case UserStatut.CONFIRME === delegue.statut:
                        return (
                          <Link variant="action" onClick={resendActivationEmail}>
                            Générer un nouvel envoi de notification
                          </Link>
                        );
                      // case UserStatut.ACTIVE === delegue.statut:
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
                Une liste mise à jour de {relation.nombre_voeux.toLocaleString()} candidat
                {relation.nombre_voeux > 1 ? "s" : ""} est disponible pour cet établissement.
              </>
            ) : (
              <>Nombre de candidats: {relation.nombre_voeux.toLocaleString()}</>
            )}
          </Heading>

          {hasVoeux ? (
            <>
              <Text mb={4}>
                Date de mise à disposition : {new Date(relation.first_date_voeux).toLocaleDateString()}{" "}
                {relation.last_date_voeux !== relation.first_date_voeux && (
                  <>| Dernière mise à jour : {new Date(relation.last_date_voeux).toLocaleDateString()}</>
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
                        {delegue.email}) a bien téléchargé la liste de candidats.{" "}
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
                        Vous avez autorisé les droits de diffusion directe à {delegue.email}, mais cette personne n'a
                        pas encore téléchargé la liste (
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
                      par vous ({responsable?.email}
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
          ) : new Date().getTime() <= new Date("2024/06/05").getTime() ? (
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
              {/* <Text mb={4}>
                Une mise à jour pourra être communiquée la semaine du 19 juin, pour prendre les éventuels ajouts. Une
                notification courriel sera alors envoyée.

              </Text> */}
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
                        case UserStatut.CONFIRME === delegue.statut:
                          return (
                            <Link variant="action" onClick={resendActivationEmail}>
                              générer un nouvel envoi de notification courriel
                            </Link>
                          );
                        case UserStatut.ACTIVE === delegue.statut:
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
                    {delegue.email}. Vous devrez vous assurer par vos propres moyens que les jeunes ayant exprimé leurs
                    vœux fassent l'objet d'une réponse rapide.
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
                      Je télécharge la liste mais je souhaite que {delegue.email} la télécharge également
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    En procédant à ce téléchargement, la délégation accordée à {delegue.email} reste en vigueur.
                  </Text>
                  <Text mb={4}>
                    La liste restera considérée comme non téléchargée jusqu'à ce que {delegue.email} procède au
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
                        case UserStatut.CONFIRME === delegue.statut:
                          return (
                            <Link variant="action" onClick={resendActivationEmail}>
                              générer un nouvel envoi de notification courriel
                            </Link>
                          );
                        case UserStatut.ACTIVE === delegue.statut:
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
            <History responsable={responsable} formateur={formateur} delegue={delegue} relation={relation} />
          ) : (
            <History formateur={formateur} delegue={delegue} relation={relation} />
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
