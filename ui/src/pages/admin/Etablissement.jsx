import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useParams } from "react-router-dom";
import {
  Text,
  Link,
  Heading,
  Box,
  useDisclosure,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Table,
  Tr,
  Tbody,
  Td,
  Th,
  Thead,
} from "@chakra-ui/react";
import { CheckIcon, DownloadIcon, EditIcon } from "@chakra-ui/icons";

import { Page } from "../../common/components/layout/Page";
import { _get, _put } from "../../common/httpClient";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import { EtablissementRaisonSociale } from "../../common/components/etablissement/fields/EtablissementLibelle";
import { UpdateResponsableEmailModal } from "../../common/components/admin/modals/UpdateResponsableEmailModal";
import { DelegationModal } from "../../common/components/admin/modals/DelegationModal";
import { UpdateDelegationModal } from "../../common/components/admin/modals/UpdateDelegationModal";
import { ContactStatut } from "../../common/components/admin/fields/ContactStatut";
import { RelationStatut } from "../../common/components/admin/fields/RelationStatut";
import { HistoryBlock } from "../../common/components/history/HistoryBlock";
import { useDownloadVoeux } from "../../common/hooks/adminHooks";
import { ConfirmDelegationModal } from "../../common/components/admin/modals/ConfirmDelegationModal";

const RelationContact = ({ relation, callback }) => {
  const {
    isOpen: isOpenUpdateDelegationModal,
    onOpen: onOpenUpdateDelegationModal,
    onClose: onCloseUpdateDelegationModal,
  } = useDisclosure();

  const {
    isOpen: isOpenConfirmDelegationModal,
    onOpen: onOpenConfirmDelegationModal,
    onClose: onCloseConfirmDelegationModal,
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
                  <Link mr={3} variant={"action"} display="inline" onClick={onOpenUpdateDelegationModal}>
                    <EditIcon mr={2} />
                    Modifier ou annuler la délégation
                  </Link>
                  {/* <Button mr={3} variant="red-light" display="inline" onClick={onOpenUpdateDelegationModal}>
                    <EditIcon mr={2} />
                    Modifier ou annuler la délégation
                  </Button> */}
                </Box>
                <Box mt={3}>
                  <Text as="i">
                    En l'absence de confirmation ou modification, le délégué renseigné sur la précédente campagne
                    recevra les listes de candidats.
                  </Text>
                </Box>
              </>
            ) : (
              <>
                <Text>
                  Contact délégué habilité :<Text as="b"> {relation.delegue?.email}</Text>.{" "}
                </Text>
                <Text mt={3}>
                  <ContactStatut user={relation.delegue} />
                </Text>
                <Box mt={3}>
                  {/* {relation.nombre_voeux && !relation.nombre_voeux_restant ? (
                    <Button mr={3} variant={"red-light"} display="inline" onClick={onOpenUpdateDelegationModal}>
                      <EditIcon mr={2} />
                      Modifier ou annuler la délégation
                    </Button>
                  ) : ( */}
                  <Link mr={3} variant={"action"} display="inline" onClick={onOpenUpdateDelegationModal}>
                    <EditIcon mr={2} />
                    Modifier ou annuler la délégation
                  </Link>
                  {/* )} */}
                </Box>
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

const RelationBlock = ({ relation, callback, isResponsableFormateur }) => {
  const { downloadVoeux, isDownloadingVoeux } = useDownloadVoeux({
    responsable: relation.responsable,
    formateur: relation.formateur,
    callback,
  });

  const toast = useToast();
  const [sendingNotificationEmail, setSendingNotificationEmail] = useState(false);
  const [sendingUpdateEmail, setSendingUpdateEmail] = useState(false);

  const resendNotificationEmail = useCallback(async () => {
    if (sendingNotificationEmail) {
      return;
    }
    try {
      setSendingNotificationEmail(true);
      await _put(
        `/api/admin/relations/${relation?.etablissement_responsable?.siret}/${relation?.etablissement_formateur?.siret}/resendNotificationEmail`
      );
      if (relation.delegue) {
        toast({
          title: "Courriel envoyé",
          description: `Le courriel de notification de mise à disposition de listes téléchargeables a été renvoyé à l'adresse ${relation?.delegue?.email}`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Courriel envoyé",
          description: `Le courriel de notification de mise à disposition de listes téléchargeables a été renvoyé à l'adresse ${relation?.responsable?.email}`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      }

      setSendingNotificationEmail(false);

      await callback?.();
    } catch (error) {
      setSendingNotificationEmail(false);
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel de notification de mise à disposition de listes téléchargeables . Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [relation, toast, callback, sendingNotificationEmail]);

  const resendUpdateEmail = useCallback(async () => {
    if (sendingUpdateEmail) {
      return;
    }
    try {
      setSendingUpdateEmail(true);
      await _put(
        `/api/admin/relations/${relation?.etablissement_responsable?.siret}/${relation?.etablissement_formateur?.siret}/resendUpdateEmail`
      );
      if (relation.delegue) {
        toast({
          title: "Courriel envoyé",
          description: `Le courriel de notification de mise à jour de listes téléchargeables a été renvoyé à l'adresse ${relation?.delegue?.email}`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Courriel envoyé",
          description: `Le courriel de notification de mise à jour de listes téléchargeables a été renvoyé à l'adresse ${relation?.responsable?.email}`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      }

      setSendingUpdateEmail(false);

      await callback?.();
    } catch (error) {
      setSendingUpdateEmail(false);
      toast({
        title: "Impossible d'envoyer le courriel",
        description:
          "Une erreur est survenue lors de la tentative de renvoie du courriel de notification de mise à jour de listes téléchargeables . Veuillez contacter le support.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [relation, toast, callback, sendingUpdateEmail]);

  return (
    <Box>
      {!isResponsableFormateur && (
        <>
          <Heading as="h4" size="md">
            <EtablissementRaisonSociale etablissement={relation.formateur} />
          </Heading>

          <Text mt={4}>
            Adresse : {relation.formateur?.adresse} - SIRET : {relation.formateur?.siret ?? "Inconnu"} - UAI :{" "}
            {relation.formateur?.uai ?? "Inconnu"}
          </Text>
        </>
      )}

      <Box mt={8}>
        <RelationContact relation={relation} callback={callback} />
      </Box>

      <Box mt={8}>
        {/* Statut de diffusion des listes : */}
        <RelationStatut relation={relation} callback={callback} />{" "}
        {!!relation?.nombre_voeux /*&& !!relation?.nombre_voeux_restant*/ && (
          <>
            {new Date(relation?.first_date_voeux)?.getTime() === new Date(relation?.last_date_voeux)?.getTime() ? (
              <Link
                ml={2}
                mt={4}
                variant="action"
                onClick={resendNotificationEmail}
                disabled={sendingNotificationEmail}
              >
                {sendingNotificationEmail && <Spinner size="sm" mr={2} />}
                Procéder à l'envoi d'un courriel de mise à disposition de la liste
              </Link>
            ) : (
              <Link ml={2} mt={4} variant="action" onClick={resendUpdateEmail} disabled={sendingUpdateEmail}>
                {sendingUpdateEmail && <Spinner size="sm" mr={2} />}
                Procéder à l'envoi d'un courriel de mise à jour de la liste
              </Link>
            )}
          </>
        )}
      </Box>

      {!!relation?.nombre_voeux && (
        <>
          <Button
            mt={4}
            variant={!!relation.nombre_voeux_restant ? "blue" : "blue-light"}
            disabled={isDownloadingVoeux}
            onClick={async () => await downloadVoeux()}
          >
            {isDownloadingVoeux ? <Spinner size="sm" mr={2} /> : <DownloadIcon mr={2} />}
            Télécharger la liste
          </Button>
        </>
      )}

      {!![
        ...(relation?.histories ?? []),
        ...(relation.responsable?.histories ?? []),
        ...(relation.delegue?.histories ?? []),
      ].length && (
        <Box mt={8}>
          <HistoryBlock
            relation={relation}
            responsable={isResponsableFormateur ? relation.responsable : null}
            delegue={relation.delegue}
          />
        </Box>
      )}
    </Box>
  );
};

export const Etablissement = () => {
  const {
    onOpen: onOpenUpdateResponsableEmailModal,
    isOpen: isOpenUpdateResponsableEmailModal,
    onClose: onCloseUpdateResponsableEmailModal,
  } = useDisclosure();

  const { identifiant } = useParams();

  const [etablissement, setEtablissement] = useState(undefined);
  const [loadingEtablissement, setLoadingEtablissement] = useState(false);
  const mounted = useRef(false);

  const getEtablissement = useCallback(async () => {
    try {
      setLoadingEtablissement(true);
      const response = await _get(`/api/admin/etablissements/${identifiant}`);
      setEtablissement(response);
      setLoadingEtablissement(false);
    } catch (error) {
      setEtablissement(undefined);
      setLoadingEtablissement(false);
      throw Error;
    }
  }, [identifiant]);

  const reload = useCallback(async () => {
    await getEtablissement();
  }, [getEtablissement]);

  // const resendActivationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/admin/etablissements/${identifiant}/resendActivationEmail`);

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
  //     await _put(`/api/admin/etablissements/${identifiant}/resendConfirmationEmail`);

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
    .sort((a, b) => b.nombre_voeux_restant - a.nombre_voeux_restant);

  const relationsFormateur = etablissement.relations
    .filter((relation) => relation.formateur?.siret === etablissement.siret)
    .sort((a, b) => b.nombre_voeux_restant - a.nombre_voeux_restant);

  const relationsOnlyResponsable = relationsResponsable.filter(
    (relation) => relation.formateur?.siret !== etablissement.siret
  );

  const relationsOnlyFormateur = relationsFormateur.filter(
    (relation) => relation.responsable?.siret !== etablissement.siret
  );

  const relationResponsableFormateur = etablissement.relations.find(
    (relation) =>
      relation.formateur?.siret === etablissement.siret && relation.responsable?.siret === etablissement.siret
  );

  return (
    <>
      <Breadcrumb items={[{ label: title, url: `/admin/etablissement/${identifiant}` }]} />

      <Page title={title}>
        <Box my={6}>
          <Box>
            <Text mt={6}>
              Adresse : {etablissement?.adresse} - SIRET : {etablissement?.siret ?? "Inconnu"} - UAI :{" "}
              {etablissement?.uai ?? "Inconnu"}
            </Text>
          </Box>

          <Box mt={3}>
            <Text>
              Contact responsable{" "}
              {(!!relationsOnlyResponsable.length ||
                (!relationsOnlyResponsable.length && !relationResponsableFormateur?.delegue)) && (
                <> habilité à réceptionner les listes de candidats</>
              )}{" "}
              : <Text as="b">{etablissement.email}</Text>{" "}
              <Link ml={2} variant={"action"} onClick={onOpenUpdateResponsableEmailModal}>
                {etablissement?.email?.length ? "Modifier" : "Renseigner l'adresse courriel"}
              </Link>
            </Text>
          </Box>

          {(etablissement.is_responsable || etablissement.is_responsable_formateur) && (
            <Box mt={3}>
              {/* Statut de création de compte : */}
              <ContactStatut user={etablissement} />
            </Box>
          )}

          {etablissement.is_responsable ? (
            <>
              <Box mt={8}>
                <HistoryBlock responsable={etablissement} />
              </Box>

              {!!relationsResponsable.length && (
                <>
                  <Box mt={12} id="responsable">
                    <Box>
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
                  </Box>
                </>
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

          {etablissement?.is_formateur && (
            <Box mt={12} id="formateur">
              <Alert status="warning">
                <AlertIcon />
                Pour une partie de ses offres, cet organisme est formateur non responsable. Cette page permet le suivi
                des candidatures uniquement sur les formations dont l’organisme est responsable.{" "}
              </Alert>

              <Text mt={6}>
                {relationsOnlyFormateur.length === 1 ? (
                  <Link variant="action" href={`/admin/etablissement/${relationsOnlyFormateur[0]?.responsable?.siret}`}>
                    Accéder à la page de l’organisme responsable
                  </Link>
                ) : (
                  <>
                    Accéder aux pages des organismes responsables :{" "}
                    {relationsOnlyFormateur.map((relation, index) => (
                      <Fragment key={relation?.responsable?.siret}>
                        <Link href={`/admin/etablissement/${relation?.responsable?.siret}`} variant="action">
                          {relation?.responsable?.raison_sociale}
                        </Link>
                        {index !== relationsOnlyFormateur.length - 1 && ", "}
                      </Fragment>
                    ))}
                  </>
                )}
              </Text>
            </Box>
          )}

          <Box mt={12}>
            <Link href="/support" variant="action">
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
      </Page>
    </>
  );
};

export default Etablissement;
