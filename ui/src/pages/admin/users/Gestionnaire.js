import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Text, Link, Heading, Box, useDisclosure, Button } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { _get } from "../../../common/httpClient";
import { GestionnaireLibelle } from "../../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { UpdateGestionnaireEmailModal } from "../../../common/components/admin/modals/UpdateGestionnaireEmailModal";

export const Gestionnaire = () => {
  const {
    onOpen: onOpenUpdateGestionnaireEmailModal,
    isOpen: isOpenUpdateGestionnaireEmailModal,
    onClose: onCloseUpdateGestionnaireEmailModal,
  } = useDisclosure();

  const { siret } = useParams();

  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const mounted = useRef(false);

  const getGestionnaire = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/gestionnaires/${siret}`);
      setGestionnaire(response);
    } catch (error) {
      setGestionnaire(undefined);
      throw Error;
    }
  }, [siret]);

  const getFormateurs = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/gestionnaires/${siret}/formateurs`);

      setFormateurs(response);
    } catch (error) {
      setFormateurs(undefined);
      throw Error;
    }
  }, [siret, setFormateurs]);

  const reload = useCallback(async () => {
    await getGestionnaire();
    await getFormateurs();
  }, [getGestionnaire, getFormateurs]);

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

  if (!gestionnaire) {
    return;
  }

  const isResponsableFormateurForAtLeastOneEtablissement = !!gestionnaire?.etablissements?.find(
    (etablissement) => etablissement.uai === gestionnaire.uai || etablissement.siret === gestionnaire.siret
  );

  return (
    <Page
      title={
        <>
          Organisme responsable :&nbsp;
          <GestionnaireLibelle gestionnaire={gestionnaire} />
        </>
      }
    >
      <Box my={12}>
        <Box mb={12}>
          <Text mb={4}>
            Adresse : {gestionnaire.adresse} {gestionnaire.cp} {gestionnaire.commune} - Siret :{" "}
            {gestionnaire.siret ?? "Inconnu"} - UAI : {gestionnaire.uai ?? "Inconnu"}
          </Text>

          <Text mb={4}>
            Email de direction enregistré : <strong>{gestionnaire?.email}</strong>.{" "}
          </Text>

          <Text mb={4}>
            L'organisme est responsable de l'offre de {gestionnaire?.etablissements?.length} organisme
            {gestionnaire?.etablissements?.length > 1 && "s"} formateur{gestionnaire?.etablissements?.length > 1 && "s"}
            .{" "}
            <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateurs`}>
              Accéder à la liste
            </Link>
          </Text>

          {isResponsableFormateurForAtLeastOneEtablissement && (
            <Text mb={4}>
              L'organisme dispense directement des formations.{" "}
              <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateur/${gestionnaire.uai}`}>
                Accéder à la page de téléchargement des vœux
              </Link>
            </Text>
          )}

          <Button variant="primary" onClick={onOpenUpdateGestionnaireEmailModal}>
            Modifier l'email
          </Button>
        </Box>

        <Box mb={12} id="statut">
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          <Heading as="h4" size="sm" mb={4}>
            Nombre de vœux disponibles : {gestionnaire.nombre_voeux}
          </Heading>

          <Text mb={4}>
            <Link variant="action" href={`/admin/gestionnaire/${gestionnaire.siret}/formateurs`}>
              Voir la liste des organismes formateurs
            </Link>{" "}
            pour accéder aux listes de vœux disponibles et à leurs statuts de téléchargement.
          </Text>

          {/* TODO: Définir quel est le mail à renvoyer fonction du statut du User (comparer avec UserStatut.XXXX) */}
          {/* <Button variant="primary" onClick={}>
            Renvoyer l'email de notification
          </Button> */}
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>
          {/* <List>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
          </List> */}
        </Box>

        <Box mb={12}>
          <Link href="/anomalie" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateGestionnaireEmailModal
          isOpen={isOpenUpdateGestionnaireEmailModal}
          onClose={onCloseUpdateGestionnaireEmailModal}
          callback={reload}
          gestionnaire={gestionnaire}
        />
      </Box>
    </Page>
  );
};

export default Gestionnaire;
