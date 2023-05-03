import { Box, Text, Heading, Link, useDisclosure, List, ListItem } from "@chakra-ui/react";

import { UpdateGestionnaireEmailModal } from "../../common/components/gestionnaire/modals/UpdateGestionnaireEmailModal";
import { Page } from "../../common/components/layout/Page";
import { GestionnaireLibelle } from "../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { GestionnaireEmail } from "../../common/components/gestionnaire/fields/GestionnaireEmail";
import { History } from "./History";

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
      <Page
        title={
          <>
            Organisme responsable :&nbsp;
            <GestionnaireLibelle gestionnaire={gestionnaire} />
          </>
        }
      >
        <Box mb={12}>
          <Text mb={4}>
            Adresse : {gestionnaire.adresse} {gestionnaire.cp} {gestionnaire.commune} - Siret :{" "}
            {gestionnaire.siret ?? "Inconnu"} - UAI : {gestionnaire.uai ?? "Inconnu"}
          </Text>

          <Text mb={4}>
            Adresse courriel du directeur de l'établissement : <GestionnaireEmail gestionnaire={gestionnaire} />.{" "}
            <Link variant="action" onClick={onOpen}>
              Modifier
            </Link>
          </Text>

          <Text mb={4}>
            L'organisme est responsable de l'offre de {gestionnaire?.etablissements?.length} organisme
            {gestionnaire?.etablissements?.length > 1 && "s"} formateur{gestionnaire?.etablissements?.length > 1 && "s"}
            .{" "}
            <Link variant="action" href="/gestionnaire/formateurs">
              Accéder à la liste
            </Link>
          </Text>

          {isResponsableFormateurForAtLeastOneEtablissement && (
            <Text mb={4}>
              L'organisme dispense directement des formations.{" "}
              <Link variant="action" href={`/gestionnaire/formateurs/${gestionnaire.uai}`}>
                Accéder à la page de téléchargement des listes de candidats
              </Link>
            </Text>
          )}
        </Box>

        <Box mb={12} id="statut">
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          <Heading as="h4" size="sm" mb={4}>
            Nombre de candidats : {gestionnaire.nombre_voeux}
          </Heading>

          <Text mb={4}>
            <Link variant="action" href={`/gestionnaire/formateurs`}>
              Voir la liste des organismes formateurs
            </Link>{" "}
            pour accéder aux listes de candidats et à leurs statuts de téléchargement.
          </Text>
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>

          <History gestionnaire={gestionnaire} />
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateGestionnaireEmailModal
          isOpen={isOpen}
          onClose={onClose}
          callback={callback}
          gestionnaire={gestionnaire}
        />
      </Page>
    </>
  );
};
