import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Text,
  Link,
  Heading,
  Box,
  useDisclosure,
  Spinner,
  Button,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Stack,
} from "@chakra-ui/react";
import { CheckIcon, DownloadIcon, EditIcon } from "@chakra-ui/icons";

import { Page } from "../../common/components/layout/Page";
import { _delete, _get, _put } from "../../common/httpClient";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import {
  EtablissementLibelle,
  EtablissementRaisonSociale,
} from "../../common/components/etablissement/fields/EtablissementLibelle";
import { UpdateResponsableEmailModal } from "../../common/components/responsable/modals/UpdateResponsableEmailModal";
import { DelegationModal } from "../../common/components/responsable/modals/DelegationModal";
import { UpdateDelegationModal } from "../../common/components/responsable/modals/UpdateDelegationModal";
import { RelationStatut } from "../../common/components/responsable/fields/RelationStatut";
import { HistoryBlock } from "../../common/components/history/HistoryBlock";
import { useDownloadVoeux } from "../../common/hooks/responsableHooks";
import { ConfirmDelegationModal } from "../../common/components/responsable/modals/ConfirmDelegationModal";
import { DownloadVoeuxModal } from "../../common/components/responsable/modals/DownloadVoeuxModal";
import { USER_STATUS } from "../../common/constants/UserStatus";

const RelationContact = ({ relation, callback }) => {
  const {
    isOpen: isOpenConfirmDelegationModal,
    onOpen: onOpenConfirmDelegationModal,
    onClose: onCloseConfirmDelegationModal,
  } = useDisclosure();

  const {
    isOpen: isOpenUpdateDelegationModal,
    onOpen: onOpenUpdateDelegationModal,
    onClose: onCloseUpdateDelegationModal,
  } = useDisclosure();

  const {
    isOpen: isOpenDelegationModal,
    onOpen: onOpenDelegationModal,
    onClose: onCloseDelegationModal,
  } = useDisclosure();

  return (
    <>
      <Box mt={3}>
        {relation.delegue ? (
          <>
            {!relation.delegue.relations.active ? (
              <>
                <Text>
                  Contact délégué habilité en 2024 à réceptionner les listes de candidats :
                  <Text as="b"> {relation.delegue?.email}</Text>.{" "}
                </Text>
                <Box mt={3}>
                  <Button mr={3} variant="green" display="inline" onClick={onOpenConfirmDelegationModal}>
                    <CheckIcon mr={2} />
                    Confirmer la délégation
                  </Button>
                  <Button mr={3} variant="red" display="inline" onClick={onOpenUpdateDelegationModal}>
                    <EditIcon mr={2} />
                    Modifier ou annuler la délégation
                  </Button>
                </Box>
                <Box mt={3}>
                  <Text as="i">
                    En l'absence de confirmation ou modification, le délégué définit sur la précédente campagne recevra
                    les listes de candidats.
                  </Text>
                </Box>
              </>
            ) : (
              <>
                <Text>
                  Contact délégué habilité :<Text as="b"> {relation.delegue?.email}</Text>.
                </Text>
                {!relation.nombre_voeux && (
                  <Box mt={3}>
                    <Button
                      mr={3}
                      variant={relation.nombre_voeux && !relation.nombre_voeux_restant ? "red-light" : "red"}
                      display="inline"
                      onClick={onOpenUpdateDelegationModal}
                    >
                      <EditIcon mr={2} />
                      Modifier ou annuler la délégation
                    </Button>
                  </Box>
                )}
              </>
            )}

            <ConfirmDelegationModal
              relation={relation}
              callback={callback}
              isOpen={isOpenConfirmDelegationModal}
              onClose={onCloseConfirmDelegationModal}
            />
            <UpdateDelegationModal
              relation={relation}
              callback={callback}
              isOpen={isOpenUpdateDelegationModal}
              onClose={onCloseUpdateDelegationModal}
            />
          </>
        ) : (
          <>
            <Button
              variant={relation.nombre_voeux && !relation.nombre_voeux_restant ? "blue-light" : "blue"}
              onClick={onOpenDelegationModal}
            >
              <EditIcon mr={2} />
              Déléguer le droit de réception des listes de candidats.
            </Button>
            <Box mt={4}>
              <Text as="i">
                En l'absence de délégation, le contact responsable sera seul destinataire des listes de candidats.
              </Text>
            </Box>

            <DelegationModal
              relation={relation}
              callback={callback}
              isOpen={isOpenDelegationModal}
              onClose={onCloseDelegationModal}
            />
          </>
        )}
      </Box>
    </>
  );
};

const DelegationAvecCandidaturesRestantesModal = ({ relation, isOpen, onClose, callback }) => {
  const responsable = relation?.responsable;
  const formateur = relation?.formateur;
  const delegue = relation?.delegue;
  const toast = useToast();

  const downloadVoeux = useDownloadVoeux({
    responsable,
    formateur,
    callback,
  });

  const cancelDelegation = useCallback(async () => {
    await _delete(`/api/responsable/delegation`, {
      siret: formateur?.siret,
    });
  }, [formateur]);

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/responsable/formateurs/${formateur?.siret}/resendActivationEmail`);

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
      await _put(`/api/responsable/formateurs/${formateur?.siret}/resendNotificationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de notification de liste de candidats disponible a été renvoyé à l'adresse ${delegue?.email}`,
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
  }, [formateur, delegue, toast, callback]);

  const resendUpdateEmail = useCallback(async () => {
    try {
      await _put(`/api/responsable/formateurs/${formateur?.uai}/resendUpdateEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de notification de misa à jour des listes de candidats disponible a été renvoyé à l'adresse ${delegue?.email}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      await callback();
    } catch (error) {
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel de notification de mise à jour. Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [formateur, delegue, toast, callback]);

  const cancelDelegationAndDownloadVoeux = useCallback(async () => {
    await cancelDelegation();
    await downloadVoeux();
    await callback?.();
  }, [cancelDelegation, downloadVoeux, callback]);

  const downloadVoeuxAndReload = useCallback(async () => {
    await downloadVoeux();
    await callback?.();
  }, [downloadVoeux, callback]);

  // const {
  //   onOpen: onOpenDelegationModal,
  //   isOpen: isOpenDelegationModal,
  //   onClose: onCloseDelegationModal,
  // } = useDisclosure();

  const {
    onOpen: onOpenUpdateDelegationModal,
    isOpen: isOpenUpdateDelegationModal,
    onClose: onCloseUpdateDelegationModal,
  } = useDisclosure();

  // const {
  //   onOpen: onOpenUpdateResponsableEmailModal,
  //   isOpen: isOpenUpdateResponsableEmailModal,
  //   onClose: onCloseUpdateResponsableEmailModal,
  // } = useDisclosure();

  const lastEmailDate =
    delegue?.emails && typeof delegue.emails.findLast === "function"
      ? new Date(delegue.emails?.findLast(() => true)?.sendDates?.findLast(() => true))
      : null;

  if (!responsable || !formateur) {
    return;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading as="h2" size="lg">
              La personne déléguée n'a pas encore téléchargé la liste de candidatures.
            </Heading>
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody>
            {!!delegue && !!relation.nombre_voeux && !!relation.nombre_voeux_restant && (
              <Box>
                <Heading as="h3" size="md">
                  Que souhaitez-vous faire ?
                </Heading>

                <Accordion defaultIndex={[]} allowToggle mt={4}>
                  <AccordionItem mb={0}>
                    <h2>
                      <AccordionButton>
                        <Box as="span" flex="1" textAlign="left">
                          Je souhaite que l'organisme formateur télécharge la liste
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel py={4}>
                      <Text mb={4}>
                        Prenez contact avec la personne destinataire pour l'inviter à télécharger la liste. Si la
                        personne n'a pas reçu d'email de notification invitez-la à consulter ses spam, en lui
                        communiquant la date à laquelle la dernière notification lui a été envoyée (
                        {lastEmailDate?.toLocaleDateString()}) et l'expéditeur des notifications (
                        {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}).
                      </Text>
                      <Text mb={4}>
                        Si malgré tout la personne ne retrouve pas la notification, vous pouvez essayer de{" "}
                        {(() => {
                          switch (true) {
                            case USER_STATUS.CONFIRME === relation.delegue.statut:
                              return (
                                <Link variant="action" onClick={resendActivationEmail}>
                                  générer un nouvel envoi de notification courriel
                                </Link>
                              );
                            case USER_STATUS.ACTIVE === relation.delegue.statut:
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
                    <AccordionPanel py={4}>
                      <Text mb={4}>
                        En procédant à ce téléchargement, vous annulez la délégation de droits précédemment accordée à{" "}
                        {delegue.email}. Vous devrez vous assurer par vos propres moyens que les jeunes ayant exprimé
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
                          Je télécharge la liste mais je souhaite que {delegue.email} la télécharge également
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel py={4}>
                      <Text mb={4}>
                        En procédant à ce téléchargement, la délégation accordée à {delegue.email} reste en vigueur.
                      </Text>
                      <Text mb={4}>
                        La liste restera considérée comme non téléchargée jusqu'à ce que {delegue.email} procède au
                        téléchargement : prenez contact avec la personne destinataire pour l'inviter à télécharger la
                        liste. Si la personne n'a pas reçu d'email de notification invitez-la à consulter ses spam, en
                        lui communiquant la date à laquelle la dernière notification lui a été envoyée (
                        {lastEmailDate?.toLocaleDateString()}) et l'expéditeur des notifications (
                        {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}).
                      </Text>
                      <Text mb={4}>
                        Si malgré tout la personne ne retrouve pas la notification, vous pouvez essayer de{" "}
                        {(() => {
                          switch (true) {
                            case USER_STATUS.CONFIRME === delegue.statut:
                              return (
                                <Link variant="action" onClick={resendActivationEmail}>
                                  générer un nouvel envoi de notification courriel
                                </Link>
                              );
                            case USER_STATUS.ACTIVE === delegue.statut:
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

            <Stack>
              <Button variant="ghost" onClick={onClose}>
                Fermer
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <UpdateDelegationModal
        onClose={onCloseUpdateDelegationModal}
        isOpen={isOpenUpdateDelegationModal}
        relation={relation}
        callback={callback}
      />
    </>
  );
};

const RelationBlock = ({ relation, callback, isResponsableFormateur }) => {
  const responsable = relation.responsable;
  const formateur = relation.formateur;
  const delegue = relation.delegue;

  const downloadVoeux = useDownloadVoeux({
    responsable,
    formateur,
    callback,
  });

  const {
    onOpen: onOpenDelegationAvecCandidaturesRestantesModal,
    isOpen: isOpenDelegationAvecCandidaturesRestantesModal,
    onClose: onCloseDelegationAvecCandidaturesRestantesModal,
  } = useDisclosure();

  return (
    <Box>
      {!isResponsableFormateur && (
        <>
          <Heading as="h4" size="md">
            <EtablissementLibelle etablissement={relation.formateur} />
          </Heading>

          <Text mt={4}>
            Adresse : {formateur?.adresse} - SIRET : {formateur?.siret ?? "Inconnu"} - UAI :{" "}
            {relation.formateur?.uai ?? "Inconnu"}
          </Text>
        </>
      )}

      <Box mt={8}>
        <RelationContact relation={relation} callback={callback} />
      </Box>

      <Text mt={8}>
        {/* Statut de diffusion des listes : */}
        <RelationStatut relation={relation} />{" "}
      </Text>

      {!!relation.nombre_voeux ? (
        <Box>
          {/* <Text mb={4}>
              Date de mise à disposition : {new Date(relation.first_date_voeux).toLocaleDateString()}{" "}
              {relation.last_date_voeux !== relation.first_date_voeux && (
                <>| Dernière mise à jour : {new Date(relation.last_date_voeux).toLocaleDateString()}</>
              )}
            </Text> */}
          {/* {hasUpdatedVoeux && (
              <Text mb={4}>
                Cette mise à jour peut comporter de nouveaux candidats, des suppressions, ou des mises à jour.
              </Text>
            )} */}
          {!!delegue ? (
            <Box mt={4}>
              {!!relation.nombre_voeux && !relation.nombre_voeux_restant ? (
                <>
                  <Text display={"flex"} alignItems="center" mb={4}>
                    Le destinataire ({delegue.email}) a bien téléchargé la liste de candidats.{" "}
                  </Text>
                  <Text mt={2}>
                    Si une mise à jour de cette liste est disponible, le contact habilité en sera notifié par courriel.
                  </Text>
                </>
              ) : (
                <Text>
                  Vous avez autorisé les droits de diffusion directe à {delegue.email}, mais cette personne n'a pas
                  encore téléchargé la liste.{" "}
                  <Link variant="action" onClick={onOpenDelegationAvecCandidaturesRestantesModal}>
                    Que faire ?
                  </Link>
                </Text>
              )}
            </Box>
          ) : (
            !!relation.nombre_voeux && (
              <Box mt={4}>
                {!relation.nombre_voeux_restant ? (
                  <Box display={"inline-flex"} alignItems={"center"}>
                    <Button variant="blue-light" onClick={async () => await downloadVoeux()}>
                      <DownloadIcon mr={2} />
                      Télécharger à nouveau
                    </Button>
                  </Box>
                ) : (
                  <Button variant="blue" onClick={async () => await downloadVoeux()}>
                    <DownloadIcon mr={2} />
                    Télécharger la liste
                  </Button>
                )}
              </Box>
            )
          )}
        </Box>
      ) : new Date().getTime() <= new Date("2025/06/07").getTime() ? (
        <Box mt={8}>
          <Text>
            Les candidatures exprimées en mai seront rendues disponibles dans la première semaine de juin. Un courriel
            vous préviendra de la mise à disposition de la liste.
          </Text>
        </Box>
      ) : (
        <Box mt={8}>
          <Text>Aucune candidature n’a été enregistrée pour cet organisme.</Text>
          <Text mt={2}>
            Si vous pensez qu’il s’agit d’une anomalie, vous pouvez{" "}
            <Link href="/support" variant="action">
              transmettre un signalement
            </Link>
            .
          </Text>
          <Text mt={2}>
            Une mise à jour pourra être communiquée la dernière semaine de juin, pour prendre les éventuels ajouts. Une
            notification courriel sera alors envoyée.
          </Text>
        </Box>
      )}

      <Box mt={6}>
        <HistoryBlock
          relation={relation}
          responsable={isResponsableFormateur ? relation.responsable : null}
          delegue={relation.delegue}
        />
      </Box>

      <DelegationAvecCandidaturesRestantesModal
        onOpen={onOpenDelegationAvecCandidaturesRestantesModal}
        onClose={onCloseDelegationAvecCandidaturesRestantesModal}
        isOpen={isOpenDelegationAvecCandidaturesRestantesModal}
        relation={relation}
        callback={callback}
      />
    </Box>
  );
};

export const Responsable = () => {
  const [searchParams] = useSearchParams();

  const siret_formateur = searchParams.get("siret_formateur");

  const {
    onOpen: onOpenUpdateResponsableEmailModal,
    isOpen: isOpenUpdateResponsableEmailModal,
    onClose: onCloseUpdateResponsableEmailModal,
  } = useDisclosure();

  const {
    onOpen: onOpenDownloadVoeuxModal,
    isOpen: isOpenDownloadVoeuxModal,
    onClose: onCloseDownloadVoeuxModal,
  } = useDisclosure();

  const [etablissement, setEtablissement] = useState(undefined);
  const [loadingEtablissement, setLoadingEtablissement] = useState(false);
  const mounted = useRef(false);
  // const toast = useToast();

  const getEtablissement = useCallback(async () => {
    try {
      setLoadingEtablissement(true);
      const response = await _get(`/api/responsable`);
      setEtablissement(response);
      setLoadingEtablissement(false);
    } catch (error) {
      setEtablissement(undefined);
      setLoadingEtablissement(false);
      throw Error;
    }
  }, []);

  const reload = useCallback(async () => {
    await getEtablissement();
  }, [getEtablissement]);

  // const downloadVoeux = useDownloadVoeux({ responsable: etablissement, formateur: etablissement, callback: reload });

  useEffect(() => {
    if (siret_formateur) {
      onOpenDownloadVoeuxModal();
    }
  }, [onOpenDownloadVoeuxModal, siret_formateur]);

  // const resendActivationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/responsable/etablissements/${identifiant}/resendActivationEmail`);

  //     toast({
  //       title: "Courriel envoyé",
  //       description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${etablissement?.email}`,
  //       status: "success",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //     await reload();
  //   } catch (error) {
  //     toast({
  //       title: "Impossible d'envoyer le courriel",
  //       description:
  //         "Une erreur est survenue lors de la tentative de renvoie du courriel d'activation. Veuillez contacter le support.",
  //       status: "error",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //   }
  // }, [identifiant, etablissement, toast, reload]);

  // const resendConfirmationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/responsable/etablissements/${identifiant}/resendConfirmationEmail`);

  //     toast({
  //       title: "Courriel envoyé",
  //       description: `Le courriel de confirmation de l'adresse courriel a été renvoyé à l'adresse ${etablissement?.email}`,
  //       status: "success",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //     await reload();
  //   } catch (error) {
  //     toast({
  //       title: "Impossible d'envoyer le courriel",
  //       description:
  //         "Une erreur est survenue lors de la tentative de renvoie du courriel de confirmation. Veuillez contacter le support.",
  //       status: "error",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //   }
  // }, [identifiant, etablissement, toast, reload]);

  // const resendNotificationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/responsable/etablissements/${identifiant}/resendNotificationEmail`);

  //     toast({
  //       title: "Courriel envoyé",
  //       description: `Le courriel de notification de listes téléchargeables a été renvoyé à l'adresse ${etablissement?.email}`,
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
  // }, [identifiant, etablissement, toast, reload]);

  const {
    onOpen: onOpenDelegationAvecCandidaturesRestantesModal,
    isOpen: isOpenDelegationAvecCandidaturesRestantesModal,
    onClose: onCloseDelegationAvecCandidaturesRestantesModal,
  } = useDisclosure();

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

  if (loadingEtablissement) {
    return <Spinner />;
  }

  if (!etablissement) {
    return;
  }

  const title = (
    <>
      <EtablissementRaisonSociale etablissement={etablissement} />
    </>
  );

  const relationsResponsable = etablissement.relations
    .filter((relation) => relation.responsable?.siret === etablissement.siret)
    .sort(
      (a, b) =>
        b.nombre_voeux_restant - a.nombre_voeux_restant ||
        b.nombre_voeux - a.nombre_voeux ||
        -b.formateur?.raison_sociale.localeCompare(a.formateur.raison_sociale) ||
        -b.formateur?.libelle_ville.localeCompare(a.formateur.libelle_ville)
    );

  // const relationsFormateur = etablissement.relations.filter(
  //   (relation) => relation.formateur?.siret === etablissement.siret
  // );

  const relationsOnlyResponsable = relationsResponsable.filter(
    (relation) => relation.formateur?.siret !== etablissement.siret
  );

  // const relationsOnlyFormateur = relationsFormateur.filter(
  //   (relation) => relation.responsable?.siret !== etablissement.siret
  // );

  const relationResponsableFormateur = etablissement.relations.find(
    (relation) =>
      relation.formateur?.siret === etablissement.siret && relation.responsable?.siret === etablissement.siret
  );

  const downloadRelation = etablissement.relations.find(
    (relation) => relation.formateur?.siret === siret_formateur && relation.responsable?.siret === etablissement.siret
  );

  return (
    <>
      <DownloadVoeuxModal
        relation={downloadRelation}
        callback={reload}
        isOpen={isOpenDownloadVoeuxModal}
        onClose={onCloseDownloadVoeuxModal}
      />

      <Breadcrumb items={[{ label: title, url: `/responsable` }]} />

      <Page title={title}>
        <Box my={6}>
          <Box>
            <Text mt={6}>
              Adresse : {etablissement?.adresse} - SIRET : {etablissement?.siret ?? "Inconnu"} - UAI :{" "}
              {etablissement?.uai ?? "Inconnu"}
            </Text>
          </Box>

          <Box mt={2}>
            <Text>
              Contact responsable
              {(!!relationsOnlyResponsable.length ||
                (!relationsOnlyResponsable.length && !relationResponsableFormateur?.delegue)) && (
                <> habilité à réceptionner les listes de candidats</>
              )}{" "}
              : <Text as="b">{etablissement.email}</Text>{" "}
              <Link variant={"action"} onClick={onOpenUpdateResponsableEmailModal}>
                {etablissement?.email?.length ? "Modifier" : "Renseigner l'adresse courriel"}
              </Link>
            </Text>
          </Box>

          {etablissement.is_responsable ? (
            <>
              <Box mt={8}>
                <HistoryBlock responsable={etablissement} />
              </Box>

              {!!relationsResponsable.length && (
                <Box mt={12} id="responsable">
                  {/* <Box>
                    <Heading as="h3" size="md" mb={8} style={{ textDecoration: "underline" }}>
                      Organismes formateurs associés
                    </Heading>

                    {relationsResponsable.map((relation, index) => (
                      <Box mt={index && 16} key={relation?.formateur?.siret}>
                        <RelationBlock relation={relation} callback={reload} />
                      </Box>
                    ))}
                  </Box> */}

                  <Table>
                    <Thead>
                      <Tr borderBottom="2px solid" borderColor="gray.200">
                        <Th>Organismes formateurs associés</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {relationsResponsable.map((relation, index) => (
                        <Tr key={relation?.formateur?.siret} borderBottom="2px solid" borderColor="gray.200">
                          <Td py={8}>
                            <RelationBlock relation={relation} callback={reload} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </>
          ) : (
            <>
              {etablissement.is_responsable_formateur && (
                <Box mt={6} id="responsable-formateur">
                  <RelationBlock relation={relationResponsableFormateur} callback={reload} isResponsableFormateur />
                </Box>
              )}
            </>
          )}

          <Box mt={12}>
            <Link variant="action" href="/ymag-ou-igesti">
              Utilisateur Ymag ou IGesti ?
            </Link>
          </Box>

          <Box mt={12}>
            <Link variant="action" href="/support">
              Signaler une anomalie
            </Link>
          </Box>
        </Box>

        <UpdateResponsableEmailModal
          responsable={etablissement}
          callback={reload}
          isOpen={isOpenUpdateResponsableEmailModal}
          onClose={onCloseUpdateResponsableEmailModal}
        />

        <DelegationAvecCandidaturesRestantesModal
          onOpen={onOpenDelegationAvecCandidaturesRestantesModal}
          onClose={onCloseDelegationAvecCandidaturesRestantesModal}
          isOpen={isOpenDelegationAvecCandidaturesRestantesModal}
          relation={relationResponsableFormateur}
          callback={reload}
        />
      </Page>
    </>
  );
};

export default Responsable;
