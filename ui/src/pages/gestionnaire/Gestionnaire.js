import { Box, Text, Heading, Link, useDisclosure, List, ListItem } from "@chakra-ui/react";

import { UpdateEmailModal } from "../../common/components/gestionnaire/modals/UpdateEmailModal";
import { Page } from "../../common/components/layout/Page";
import { GestionnaireLibelle } from "../../common/components/gestionnaire/fields/Libelle";

export const Gestionnaire = ({ gestionnaire, formateurs, callback }) => {
  const { onOpen, isOpen, onClose } = useDisclosure();

  if (!gestionnaire) {
    return;
  }

  const isResponsableFormateurForAtLeastOneEtablissement = !!gestionnaire?.etablissements?.find(
    (etablissement) => etablissement.uai === gestionnaire.uai || etablissement.siret === gestionnaire.siret
  );

  return (
    <>
      <Page title={`Organisme responsable : ${gestionnaire.raison_sociale ?? "Raison sociale inconnue"}`}>
        <Box mb={12}>
          <Heading as="h3" size="md" display="flex" mb={4}>
            Organisme responsable :&nbsp;
            <GestionnaireLibelle gestionnaire={gestionnaire} />
          </Heading>

          <Text mb={4}>
            Adresse : {gestionnaire.adresse} {gestionnaire.cp} {gestionnaire.commune} - Siret :{" "}
            {gestionnaire.siret ?? "Inconnu"} - UAI : {gestionnaire.uai ?? "Inconnu"}
          </Text>

          <Text mb={4}>
            Adresse courriel du directeur de l'établissement : {gestionnaire?.email}.{" "}
            <Link variant="action" onClick={onOpen}>
              Modifier
            </Link>
          </Text>

          <Text mb={4}>
            L'organisme est responsable de l'offre de {gestionnaire?.etablissements?.length} organisme(s) formateur(s).{" "}
            <Link variant="action" href="/gestionnaire/formateurs">
              Accéder à la liste
            </Link>
          </Text>

          {isResponsableFormateurForAtLeastOneEtablissement && (
            <Text mb={4}>
              L'organisme dispense directement des formations.{" "}
              <Link variant="action" href={`/gestionnaire/formateurs/${gestionnaire.uai}`}>
                Accéder à la page de téléchargement des vœux.
              </Link>
            </Text>
          )}
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>
          <List>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
          </List>
        </Box>

        <Box mb={12}>
          <Link href="/anomalie" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateEmailModal isOpen={isOpen} onClose={onClose} callback={callback} gestionnaire={gestionnaire} />
      </Page>
    </>
  );
};
