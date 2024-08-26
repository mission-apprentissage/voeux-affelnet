import { Box, Text, Heading, Link, useDisclosure } from "@chakra-ui/react";

import { UpdateResponsableEmailModal } from "../../common/components/responsable/modals/UpdateResponsableEmailModal";
import { Page } from "../../common/components/layout/Page";
import { ResponsableLibelle } from "../../common/components/responsable/fields/ResponsableLibelle";
import { ResponsableEmail } from "../../common/components/responsable/fields/ResponsableEmail";
import { History } from "./History";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const Responsable = ({ responsable, callback }) => {
  const { onOpen, isOpen, onClose } = useDisclosure();

  if (!responsable) {
    return;
  }

  const isResponsableFormateurForAtLeastOneEtablissement = !!responsable?.relations?.find(
    (relation) =>
      relation.etablissement_formateur.uai === responsable?.uai ||
      relation.etablissement_formateur.siret === responsable?.siret
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

      <Page
        title={
          <>
            Organisme responsable :&nbsp;
            <ResponsableLibelle responsable={responsable} />
          </>
        }
      >
        <Box mb={12}>
          <Text mb={4}>
            Adresse : {responsable?.adresse} - Siret : {responsable?.siret ?? "Inconnu"} - UAI :{" "}
            {responsable?.uai ?? "Inconnu"}
          </Text>

          <Text mb={4}>
            Adresse courriel du directeur de l'établissement : <ResponsableEmail responsable={responsable} />.{" "}
            <Link variant="action" onClick={onOpen}>
              Modifier
            </Link>
          </Text>

          <Text mb={4}>
            L'organisme est responsable de l'offre de {responsable?.relations?.length} organisme
            {responsable?.relations?.length > 1 && "s"} formateur
            {responsable?.relations?.length > 1 && "s"}.{" "}
            <Link variant="action" href="/responsable/formateurs">
              Accéder à la liste
            </Link>
          </Text>

          {isResponsableFormateurForAtLeastOneEtablissement && (
            <Text mb={4}>
              L'organisme dispense directement des formations.{" "}
              <Link variant="action" href={`/responsable/formateurs/${responsable?.uai}`}>
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
            Nombre de candidats : {responsable?.nombre_voeux.toLocaleString()}
          </Heading>

          <Text mb={4}>
            <Link variant="action" href={`/responsable/formateurs`}>
              Voir la liste des organismes formateurs
            </Link>{" "}
            pour accéder aux listes de candidats et à leurs statuts de téléchargement.
          </Text>
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>

          <History responsable={responsable} />
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>

        <UpdateResponsableEmailModal isOpen={isOpen} onClose={onClose} callback={callback} responsable={responsable} />
      </Page>
    </>
  );
};
