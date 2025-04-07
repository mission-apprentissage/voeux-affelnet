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
} from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";
import { _get } from "../../common/httpClient";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import { EtablissementLibelle } from "../../common/components/etablissement/fields/EtablissementLibelle";
import { UpdateResponsableEmailModal } from "../../common/components/responsable/modals/UpdateResponsableEmailModal";
import { DelegationModal } from "../../common/components/responsable/modals/DelegationModal";
import { UpdateDelegationModal } from "../../common/components/responsable/modals/UpdateDelegationModal";
import { RelationStatut } from "../../common/components/responsable/fields/RelationStatut";
import { HistoryBlock } from "../../common/components/history/HistoryBlock";
import { useDownloadVoeux } from "../../common/hooks/responsableHooks";
import { ConfirmDelegationModal } from "../../common/components/responsable/modals/ConfirmDelegationModal";
import { DownloadVoeuxModal } from "../../common/components/responsable/modals/DownloadVoeuxModal";

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
      <Text>
        {relation.delegue ? (
          <>
            <Text>
              {!relation.delegue.relations.active ? (
                <>
                  Contact habilité en 2024 à réceptionner les listes de candidats :
                  <Text as="b"> {relation.delegue?.email}</Text>.{" "}
                  <Link variant="action" onClick={onOpenConfirmDelegationModal}>
                    Confirmer la délégation
                  </Link>
                </>
              ) : (
                <>
                  Contact habilité :<Text as="b"> {relation.delegue?.email}</Text>.
                </>
              )}{" "}
              <Link variant="action" onClick={onOpenUpdateDelegationModal}>
                Modifier ou annuler la délégation
              </Link>
            </Text>

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
            <Link variant="action" onClick={onOpenDelegationModal}>
              Déléguer le droit de réception des listes de candidats.
            </Link>{" "}
            <Text as="i">
              En l'absence de délégation, le responsable sera seul destinataire des listes de candidats.
            </Text>
            <DelegationModal
              relation={relation}
              callback={callback}
              isOpen={isOpenDelegationModal}
              onClose={onCloseDelegationModal}
            />
          </>
        )}
      </Text>
    </>
  );
};

const RelationFormateur = ({ relation, callback }) => {
  const downloadVoeux = useDownloadVoeux({
    responsable: relation.responsable,
    formateur: relation.formateur,
    callback,
  });

  return (
    <Box mt={8}>
      <Heading as="h4" size="md">
        <EtablissementLibelle etablissement={relation.formateur} />
      </Heading>

      <Text mt={4}>
        <Text as="i" color="gray.500">
          {relation.formateur?.adresse} - SIRET : {relation.formateur?.siret ?? "Inconnu"} - UAI :{" "}
          {relation.formateur?.uai ?? "Inconnu"}
        </Text>
      </Text>

      <Box mt={2}>
        <RelationContact relation={relation} callback={callback} />
      </Box>

      <Text mt={6}>
        {/* Statut de diffusion des listes : */}
        <RelationStatut relation={relation} />{" "}
      </Text>

      {!!relation?.nombre_voeux && (
        <Button mt={6} variant="primary" onClick={async () => await downloadVoeux()}>
          Télécharger la liste
        </Button>
      )}

      <Box mt={6}>
        <HistoryBlock relation={relation} delegue={relation.delegue} />
      </Box>
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
    onOpen: onOpenUDownloadVoeuxModal,
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

  const downloadVoeux = useDownloadVoeux({ responsable: etablissement, formateur: etablissement, callback: reload });

  useEffect(() => {
    if (siret_formateur) {
      onOpenUDownloadVoeuxModal();
    }
  }, [onOpenUDownloadVoeuxModal, siret_formateur]);

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
      <EtablissementLibelle etablissement={etablissement} />
    </>
  );

  const relationsResponsable = etablissement.relations.filter(
    (relation) => relation.responsable?.siret === etablissement.siret
  );

  // const relationsFormateur = etablissement.relations.filter(
  //   (relation) => relation.formateur?.siret === etablissement.siret
  // );

  // const relationsOnlyResponsable = relationsResponsable.filter(
  //   (relation) => relation.formateur?.siret !== etablissement.siret
  // );

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
              <Text as="i" color="gray.500">
                Adresse : {etablissement?.adresse} - SIRET : {etablissement?.siret ?? "Inconnu"} - UAI :{" "}
                {etablissement?.uai ?? "Inconnu"}
              </Text>
            </Text>
          </Box>

          <Box mt={2}>
            <Text>
              Contact habilité à réceptionner les listes de candidats : <Text as="b">{etablissement.email}</Text>{" "}
              <Link variant={"action"} onClick={onOpenUpdateResponsableEmailModal}>
                {etablissement?.email?.length ? "Modifier" : "Renseigner l'adresse courriel"}
              </Link>
            </Text>
          </Box>

          {etablissement.is_responsable ? (
            <>
              {!!relationsResponsable.length && (
                <Box mt={12} id="responsable">
                  {/* <Box>
                    <Heading as="h3" size="md" mb={8} style={{ textDecoration: "underline" }}>
                      Organismes formateurs associés
                    </Heading>

                    {relationsResponsable.map((relation, index) => (
                      <Box mt={index && 16} key={relation?.formateur?.siret}>
                        <RelationFormateur relation={relation} callback={reload} />
                      </Box>
                    ))}
                  </Box> */}

                  <Table>
                    <Thead>
                      <Tr borderBottom="2px solid" borderColor="gray.200">
                        <Th> Organismes formateurs associés</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {relationsResponsable.map((relation, index) => (
                        <Tr key={relation?.formateur?.siret} borderBottom="2px solid" borderColor="gray.200">
                          <Td py={8}>
                            <RelationFormateur relation={relation} callback={reload} />
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
                  <Text>
                    {/* Statut de diffusion des listes : */}
                    <RelationStatut relation={relationResponsableFormateur} />{" "}
                  </Text>

                  {!!relationResponsableFormateur?.nombre_voeux && (
                    <Button mt={6} variant="primary" onClick={async () => await downloadVoeux()}>
                      Télécharger la liste
                    </Button>
                  )}

                  <Box mt={6}>
                    <HistoryBlock
                      relation={relationResponsableFormateur}
                      responsable={etablissement}
                      delegue={relationResponsableFormateur?.delegue}
                    />
                  </Box>
                </Box>
              )}
            </>
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

export default Responsable;
