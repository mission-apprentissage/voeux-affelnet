import { Box, Text, Heading, Link, useDisclosure } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";
import { UpdateDelegueEmailModal } from "../../common/components/delegue/modals/UpdateDelegueEmailModal";
import { History } from "../responsable/History";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const Delegue = ({ delegue, callback }) => {
  const { onOpen, isOpen, onClose } = useDisclosure();

  if (!delegue) {
    return;
  }

  const relations = delegue?.relations?.filter((relation) => relation.active) ?? [];

  const title = (
    <>
      Compte délégué :&nbsp;<strong>{delegue.email}</strong>
    </>
  );

  return (
    <>
      <Breadcrumb
        items={[
          {
            label: "Profil",
            url: "/profil",
          },
        ]}
      />

      <Page title={title}>
        <Box mb={12}>
          <Text mb={4}>
            Votre adresse courriel : {delegue.email}.{" "}
            <Link variant="action" onClick={onOpen}>
              Modifier
            </Link>
          </Text>

          <Text mb={4}>
            Des délégations de droits au téléchargement des listes de candidats vous ont été accordées pour{" "}
            {relations?.length} organisme
            {relations?.length > 1 && "s"} formateur
            {relations?.length > 1 && "s"}.{" "}
            <Link variant="action" href="/delegue/relations">
              {relations?.length === 1 ? <>Accéder au téléchargement</> : <>Accéder à la liste</>}
            </Link>
          </Text>
        </Box>

        <Box mb={12} id="statut">
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          <Heading as="h4" size="sm" mb={4}>
            Nombre de candidats : {relations.reduce((acc, relation) => acc + relation.nombre_voeux, 0)}
          </Heading>
          <Heading as="h4" size="sm" mb={4}>
            Nombre de candidats restant à télécharger :{" "}
            {relations.reduce((acc, relation) => acc + relation.nombre_voeux_restant, 0)}
          </Heading>

          <Text mb={4}>
            <Link variant="action" href={`/delegue/relations`}>
              {relations?.length === 1 ? (
                <>Accéder à la page de l'organisme</>
              ) : (
                <>Voir la liste des délégations de droits accordées</>
              )}
            </Link>{" "}
            pour accéder aux listes de candidats.
          </Text>
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>

          <History delegue={delegue} />
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateDelegueEmailModal isOpen={isOpen} onClose={onClose} callback={callback} delegue={delegue} />
      </Page>
    </>
  );
};
