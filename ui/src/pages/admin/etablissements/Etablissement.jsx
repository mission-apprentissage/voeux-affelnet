import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Text, Link, Heading, Box, useDisclosure, Button, useToast, Spinner, Alert, AlertIcon } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { _get, _put } from "../../../common/httpClient";
import { EtablissementLibelle } from "../../../common/components/etablissement/fields/EtablissementLibelle";
import { UpdateResponsableEmailModal } from "../../../common/components/admin/modals/UpdateResponsableEmailModal";
// import { History } from "../../etablissement/History";
import { Breadcrumb } from "../../../common/components/Breadcrumb";
import { OrganismeResponsableTag } from "../../../common/components/tags/OrganismeResponsable";
import { OrganismeResponsableFormateurTag } from "../../../common/components/tags/OrganismeResponsableFormateur";
import { OrganismeFormateurTag } from "../../../common/components/tags/OrganismeFormateur";
import { UpdateDelegationModal } from "../../../common/components/admin/modals/UpdateDelegationModal";
import { DelegationModal } from "../../../common/components/admin/modals/DelegationModal";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { ContactResponsableTag } from "../../../common/components/tags/ContactResponsable";
import { ContactDelegueTag } from "../../../common/components/tags/ContactDelegue";
import { RelationHistoryModal } from "../../../common/components/admin/modals/RelationHistoryModal";

const RelationContact = ({ relation, callback }) => {
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
    <Text mb={2}>
      Contact habilité :{" "}
      {relation.delegue ? (
        <>
          {relation.delegue?.email} <ContactDelegueTag />
        </>
      ) : (
        <>
          {relation.responsable?.email} <ContactResponsableTag />
        </>
      )}{" "}
      {relation.delegue ? (
        <>
          <Link variant="action" onClick={onOpenUpdateDelegationModal}>
            Modifier ou annuler la délégation
          </Link>
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
            Modifier{" "}
          </Link>
          <DelegationModal
            relation={relation}
            callback={callback}
            isOpen={isOpenDelegationModal}
            onClose={onCloseDelegationModal}
          />
        </>
      )}
    </Text>
  );
};

const RelationFormateur = ({ relation, callback }) => {
  const {
    isOpen: isOpenRelationHistoryModal,
    onOpen: onOpenRelationHistoryModal,
    onClose: onCloseRelationHistoryModal,
  } = useDisclosure();

  return (
    <Box mb={8} key={relation.etablissement_formateur.siret}>
      <Heading as="h4" size="md" mb={4}>
        <EtablissementLibelle etablissement={relation.formateur} />
      </Heading>

      <Text mb={2}>
        Adresse : {relation.formateur?.adresse} - SIRET : {relation.formateur?.siret ?? "Inconnu"} - UAI :{" "}
        {relation.formateur?.uai ?? "Inconnu"}
      </Text>

      <RelationContact relation={relation} callback={callback} />

      <Text mb={2}>
        Statut : <FormateurStatut relation={relation} />{" "}
        <Link variant="action" onClick={onOpenRelationHistoryModal}>
          Historique des actions
        </Link>
        <RelationHistoryModal
          formateur={relation.formateur}
          relation={relation}
          isOpen={isOpenRelationHistoryModal}
          onClose={onCloseRelationHistoryModal}
        />
      </Text>

      <Text mb={2}>
        Nombre de candidats : {relation.nombre_voeux} - Restant à télécharger : {relation.nombre_voeux_restant}
      </Text>
    </Box>
  );
};

export const Etablissement = () => {
  const {
    onOpen: onOpenUpdateResponsableEmailModal,
    isOpen: isOpenUpdateResponsableEmailModal,
    onClose: onCloseUpdateResponsableEmailModal,
  } = useDisclosure();

  const {
    isOpen: isOpenRelationHistoryModal,
    onOpen: onOpenRelationHistoryModal,
    onClose: onCloseRelationHistoryModal,
  } = useDisclosure();

  const { identifiant } = useParams();

  const [etablissement, setEtablissement] = useState(undefined);
  const [loadingEtablissement, setLoadingEtablissement] = useState(false);
  const mounted = useRef(false);
  const toast = useToast();

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

  const resendActivationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/etablissements/${identifiant}/resendActivationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel d'activation du compte a été renvoyé à l'adresse ${etablissement?.email}`,
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
  }, [identifiant, etablissement, toast, reload]);

  const resendConfirmationEmail = useCallback(async () => {
    try {
      await _put(`/api/admin/etablissements/${identifiant}/resendConfirmationEmail`);

      toast({
        title: "Courriel envoyé",
        description: `Le courriel de confirmation de l'adresse courriel a été renvoyé à l'adresse ${etablissement?.email}`,
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
  }, [identifiant, etablissement, toast, reload]);

  // const resendNotificationEmail = useCallback(async () => {
  //   try {
  //     await _put(`/api/admin/etablissements/${identifiant}/resendNotificationEmail`);

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

  const isResponsableFormateurForAtLeastOneEtablissement = !!etablissement?.is_responsable_formateur;

  const title = (
    <>
      <EtablissementLibelle etablissement={etablissement} />
    </>
  );

  const isOnlyResponsableFormateur = etablissement.is_responsable_formateur && etablissement.relations.length === 1;

  const relationsResponsable = etablissement.relations.filter(
    (relation) => relation.responsable?.siret === etablissement.siret
  );

  const relationsFormateur = etablissement.relations.filter(
    (relation) => relation.formateur?.siret === etablissement.siret
  );

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
          <Box mb={12}>
            <Box mb={6}>
              {etablissement.is_responsable && <OrganismeResponsableTag verticalAlign="baseline" ml={2} />}
              {etablissement.is_responsable_formateur && (
                <OrganismeResponsableFormateurTag verticalAlign="baseline" ml={2} />
              )}
              {etablissement.is_formateur && <OrganismeFormateurTag verticalAlign="baseline" ml={2} />}
            </Box>

            <Text mb={6}>
              Adresse : {etablissement?.adresse} - SIRET : {etablissement?.siret ?? "Inconnu"} - UAI :{" "}
              {etablissement?.uai ?? "Inconnu"}
            </Text>
          </Box>

          {(etablissement.is_responsable || etablissement.is_responsable_formateur) && (
            <Box mb={12}>
              <Heading as="h3" size="md" mb={8} style={{ textDecoration: "underline" }}>
                Email de direction enregistré
              </Heading>

              <Text>
                {etablissement.email}{" "}
                <Link variant={"action"} onClick={onOpenUpdateResponsableEmailModal}>
                  {etablissement?.email?.length ? "Modifier" : "Renseigner l'adresse courriel"}
                </Link>
              </Text>
            </Box>
          )}

          {etablissement.is_responsable_formateur && (
            <Box mb={12} id="responsable-formateur">
              <Alert status="info" mb={6}>
                <AlertIcon />
                L'organisme est à la fois responsable et formateur d'offres de formations.
              </Alert>

              <Box mb={6}>
                <Heading as="h3" size="md" mb={8} style={{ textDecoration: "underline" }}>
                  Statut
                </Heading>

                <RelationContact relation={relationResponsableFormateur} callback={reload} />

                <Text mb={2}>
                  Statut : <FormateurStatut relation={relationResponsableFormateur} />{" "}
                  <Link variant="action" onClick={onOpenRelationHistoryModal}>
                    Historique des actions
                  </Link>
                  <RelationHistoryModal
                    responsable={etablissement}
                    formateur={etablissement}
                    relation={relationResponsableFormateur}
                    isOpen={isOpenRelationHistoryModal}
                    onClose={onCloseRelationHistoryModal}
                  />
                </Text>

                <Text mb={2}>
                  Nombre de candidats : {relationResponsableFormateur.nombre_voeux} - Restant à télécharger :{" "}
                  {relationResponsableFormateur.nombre_voeux_restant}
                </Text>
              </Box>
            </Box>
          )}

          {etablissement?.is_responsable && (
            <Box mb={12} id="responsable">
              <Alert status="info" mb={6}>
                <AlertIcon />
                L'organisme est {etablissement.is_responsable_formateur && "également"} responsable de l'offre de
                formation dispensée par{" "}
                {
                  [...new Set(relationsOnlyResponsable.map((relation) => relation.etablissement_formateur.siret))]
                    .length
                }{" "}
                formateurs.
              </Alert>

              {/* <Text mb={8}>
                L'organisme est responsable de l'offre de {relationsOnlyResponsable?.length} organisme
                {relationsOnlyResponsable?.length > 1 && "s"} formateur
                {relationsOnlyResponsable?.length > 1 && "s"}.<br />
                <Link variant="action" href={`/admin/responsable/${etablissement?.siret}`}>
                  Accéder à la page du responsable
                </Link>
                <br />
                <Link variant="action" href={`/admin/responsable/${etablissement?.siret}/formateurs`}>
                  Accéder à la liste des formateurs
                </Link>
              </Text> */}

              <Box mb={6}>
                <Heading as="h3" size="md" mb={8} style={{ textDecoration: "underline" }}>
                  Organismes formateurs associés
                </Heading>

                {relationsOnlyResponsable.map((relation) => (
                  <RelationFormateur key={relation?.formateur?.siret} relation={relation} callback={reload} />
                ))}
              </Box>
            </Box>
          )}

          {etablissement?.is_formateur && (
            <Box mb={12} id="formateur">
              {/* <Text mb={8}>
                L'organisme dispense des formations pour le compte de {relationsOnlyFormateur?.length} organisme
                {relationsOnlyFormateur?.length > 1 && "s"} responsable
                {relationsOnlyFormateur?.length > 1 && "s"}.
                <br />
                <Link variant="action" href={`/admin/formateur/${etablissement?.siret}/responsables`}>
                  Accéder à la liste
                </Link>
              </Text> */}
              <Alert status="warning" mb={6}>
                <AlertIcon />
                Pour une partie de ses offres, cet organisme est formateur non responsable. Cette page permet le suivi
                des candidatures uniquement sur les formations dont l’organisme est responsable.{" "}
              </Alert>

              <Text mb={6}>
                {relationsOnlyFormateur.length === 1 ? (
                  <Link variant="action" href={`/admin/etablissement/${relationsOnlyFormateur[0]?.responsable?.siret}`}>
                    Accéder à la page de l’organisme responsable
                  </Link>
                ) : (
                  <>
                    Accéder aux pages des organismes responsables :{" "}
                    {relationsOnlyFormateur.map((relation, index) => (
                      <>
                        <Link href={`/admin/etablissement/${relation?.responsable?.siret}`} variant="action">
                          {relation?.responsable?.raison_sociale}
                        </Link>
                        {index !== relationsOnlyFormateur.length - 1 && ", "}
                      </>
                    ))}
                  </>
                )}
              </Text>
            </Box>
          )}

          <Box mb={12}>
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
