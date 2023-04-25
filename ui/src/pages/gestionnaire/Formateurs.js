import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Text, Box, Link, Alert, AlertIcon } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";

import { FormateursAvecVoeux } from "./FormateursAvecVoeux";
import { FormateursSansVoeux } from "./FormateursSansVoeux";

export const Formateurs = ({ gestionnaire, formateurs, callback }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (gestionnaire?.etablissements.length === 1 && gestionnaire.etablissements[0].uai === gestionnaire.uai) {
      navigate(`/gestionnaire/formateurs/${gestionnaire.uai}`, { replace: true });
    }
  }, [gestionnaire?.etablissements, gestionnaire?.uai, navigate]);

  if (!gestionnaire) {
    return;
  }

  const avecVoeux = !!gestionnaire.etablissements.find((etablissement) => etablissement.nombre_voeux);
  // const avecVoeux = false;
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

        <Alert status={"info"} variant="left-accent">
          <AlertIcon />
          <Text fontStyle="italic">
            Nouveauté pour 2023 : vous avez maintenant la possibilité de déléguer les droits de réception des listes de
            candidats aux organismes dont vous êtes responsable. En cas de délégation de droits, vous conserverez un
            accès à l'ensemble des listes, et vous pourrez visualiser les statuts d'avancement de chaque établissement.
          </Text>
        </Alert>

        <Box mb={12}>
          {formateurs && avecVoeux && (
            <FormateursAvecVoeux gestionnaire={gestionnaire} formateurs={formateurs} callback={callback} />
          )}

          {formateurs && !avecVoeux && (
            <FormateursSansVoeux gestionnaire={gestionnaire} formateurs={formateurs} callback={callback} />
          )}
        </Box>

        <Box mb={12}>
          <Link href="/anomalie" variant="action">
            Signaler une anomalie
          </Link>
        </Box>
      </Page>
    </>
  );
};

export default Formateurs;
