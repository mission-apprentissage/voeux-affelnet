// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { Text, Box, Link, Alert, AlertIcon } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";

import { FormateursAvecVoeux } from "./FormateursAvecVoeux";
import { FormateursSansVoeux } from "./FormateursSansVoeux";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const Formateurs = ({ responsable, callback }) => {
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (
  //     responsable?.relations.length === 1 &&
  //     responsable?.relations[0].etablissements_formateur.siret === responsable?.siret
  //   ) {
  //     navigate(`/responsable/formateurs/${responsable?.siret}`, { replace: true });
  //   }
  // }, [responsable, navigate]);

  if (!responsable) {
    return;
  }

  const avecVoeux = !!responsable?.nombre_voeux;

  const title = "Listes de candidats aux formations : console d'administration et de téléchargement";

  return (
    <>
      <Breadcrumb
        items={[
          {
            label: title,
            url: `/responsable/formateurs`,
          },
        ]}
      />

      <Page title={title}>
        <Box mb={12}>
          {!avecVoeux && (
            <Text mb={4}>
              <strong>
                Voici la listes des organismes formateurs pour lesquels vous êtes identifié comme responsable. Vous
                aurez prochainement la possibilité sur ce même écran de télécharger les listes de candidats exprimés via
                le service en ligne Affelnet.
              </strong>
            </Text>
          )}
        </Box>

        <Alert status="info" variant="left-accent">
          <AlertIcon />
          <Text fontStyle="italic">
            Vous avez la possibilité de déléguer les droits de réception des listes de candidats aux organismes dont
            vous êtes responsable, en cliquant sur les boutons "Détail". En cas de délégation de droits, vous
            conserverez un accès à l'ensemble des listes, et vous pourrez visualiser les statuts d'avancement de chaque
            établissement.
          </Text>
        </Alert>

        <Box mb={12}>
          {responsable?.relations && avecVoeux && (
            <FormateursAvecVoeux
              responsable={responsable}
              // formateurs={formateurs}
              // delegues={delegues}
              callback={callback}
            />
          )}

          {responsable?.relations && !avecVoeux && (
            <FormateursSansVoeux
              responsable={responsable}
              // formateurs={formateurs}
              // delegues={delegues}
              callback={callback}
            />
          )}
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>
      </Page>
    </>
  );
};

export default Formateurs;
