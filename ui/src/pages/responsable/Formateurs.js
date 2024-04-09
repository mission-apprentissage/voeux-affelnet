import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Text, Box, Link, Alert, AlertIcon } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";

import { FormateursAvecVoeux } from "./FormateursAvecVoeux";
import { FormateursSansVoeux } from "./FormateursSansVoeux";

export const Formateurs = ({ responsable, formateurs, callback }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (
      responsable?.etablissements_formateur.length === 1 &&
      responsable.etablissements_formateur[0].uai === responsable.uai
    ) {
      navigate(`/responsable/formateurs/${responsable.uai}`, { replace: true });
    }
  }, [responsable?.etablissements_formateur, responsable?.uai, navigate]);

  if (!responsable) {
    return;
  }

  const avecVoeux = !!responsable.etablissements_formateur.find((etablissement) => etablissement.nombre_voeux);

  return (
    <>
      <Page title={"Listes de candidats aux formations : console d'administration et de téléchargement"}>
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
            Nouveauté pour 2023 : vous avez maintenant la possibilité de déléguer les droits de réception des listes de
            candidats aux organismes dont vous êtes responsable, en cliquant sur les boutons "Détail". En cas de
            délégation de droits, vous conserverez un accès à l'ensemble des listes, et vous pourrez visualiser les
            statuts d'avancement de chaque établissement.
          </Text>
        </Alert>

        <Box mb={12}>
          {formateurs && avecVoeux && (
            <FormateursAvecVoeux responsable={responsable} formateurs={formateurs} callback={callback} />
          )}

          {formateurs && !avecVoeux && (
            <FormateursSansVoeux responsable={responsable} formateurs={formateurs} callback={callback} />
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
