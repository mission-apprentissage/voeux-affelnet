import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Text, Link, Heading, Box, useDisclosure, Button, useToast, Spinner } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { _get, _put } from "../../../common/httpClient";
import { EtablissementLibelle } from "../../../common/components/etablissement/fields/EtablissementLibelle";
import { UpdateResponsableEmailModal } from "../../../common/components/admin/modals/UpdateResponsableEmailModal";
// import { History } from "../../etablissement/History";
import { UserType } from "../../../common/constants/UserType";
import { UserStatut } from "../../../common/constants/UserStatut";
import { ResponsableStatut } from "../../../common/components/admin/fields/ResponsableStatut";
import { Breadcrumb } from "../../../common/components/Breadcrumb";

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
      Organisme :&nbsp;
      <EtablissementLibelle etablissement={etablissement} />
    </>
  );

  const isOnlyResponsableFormateur = etablissement.is_responsable_formateur && etablissement.relations.length === 1;

  const relationsResponsable = etablissement.relations.filter(
    (relation) => relation.responsable?.uai === etablissement.uai
  );

  const relationsFormateur = etablissement.relations.filter(
    (relation) => relation.formateur?.uai === etablissement.uai
  );

  const relationsOnlyResponsable = relationsResponsable.filter(
    (relation) => relation.formateur?.uai !== etablissement.uai
  );

  const relationsOnlyFormateur = relationsFormateur.filter(
    (relation) => relation.responsable?.uai !== etablissement.uai
  );

  const relationResponsableFormateur = etablissement.relations.find(
    (relation) => relation.formateur?.uai === etablissement.uai && relation.responsable?.uai === etablissement.uai
  );

  return (
    <>
      <Breadcrumb items={[{ label: title, url: `/admin/etablissement/${identifiant}` }]} />

      <Page title={title}>
        <Box my={12}>
          <Box mb={12}>
            <Text mb={8}>
              Adresse : {etablissement?.adresse} - UAI : {etablissement?.uai ?? "Inconnu"}
            </Text>

            {etablissement?.is_responsable && !isOnlyResponsableFormateur && !!relationsOnlyResponsable?.length && (
              <Text mb={8}>
                L'organisme est responsable de l'offre de {relationsResponsable?.length} organisme
                {relationsResponsable?.length > 1 && "s"} formateur
                {relationsResponsable?.length > 1 && "s"}.<br />
                <Link variant="action" href={`/admin/responsable/${etablissement?.uai}`}>
                  Accéder à la page du responsable
                </Link>
                <br />
                <Link variant="action" href={`/admin/responsable/${etablissement?.uai}/formateurs`}>
                  Accéder à la liste des formateurs
                </Link>
              </Text>
            )}

            {etablissement?.is_formateur && !isOnlyResponsableFormateur && !!relationsOnlyFormateur?.length && (
              <Text mb={8}>
                L'organisme dispense des formations pour le compte de {relationsFormateur?.length} organisme
                {relationsFormateur?.length > 1 && "s"} responsable
                {relationsFormateur?.length > 1 && "s"}.
                <br />
                <Link variant="action" href={`/admin/formateur/${etablissement?.uai}/responsables`}>
                  Accéder à la liste
                </Link>
              </Text>
            )}

            {etablissement.is_responsable_formateur && (
              <Text mb={8}>
                L'organisme dispense directement des formations.
                <br />
                <Link
                  variant="action"
                  href={`/admin/responsable/${etablissement?.uai}/formateur/${etablissement?.uai}`}
                >
                  Accéder à la page de téléchargement des listes de candidats
                </Link>
              </Text>
            )}
          </Box>

          <Box mb={12}>
            <Link href="/support" variant="action">
              Signaler une anomalie
            </Link>
          </Box>
        </Box>
      </Page>
    </>
  );
};

export default Etablissement;
