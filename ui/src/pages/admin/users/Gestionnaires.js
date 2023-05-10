import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Text, Box, Link, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { GestionnaireLibelle } from "../../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { _get } from "../../../common/httpClient";
import { OrganismeResponsableTag } from "../../../common/components/tags/OrganismeResponsable";
import { GestionnaireEmail } from "../../../common/components/admin/fields/GestionnaireEmail";
import { GestionnaireStatut } from "../../../common/components/admin/fields/GestionnaireStatut";

export const Gestionnaires = () => {
  const { uai } = useParams();
  const navigate = useNavigate();

  const [formateur, setFormateur] = useState(undefined);
  const [gestionnaires, setGestionnaires] = useState(undefined);
  const mounted = useRef(false);

  const getFormateur = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/formateurs/${uai}`);
      setFormateur(response);
    } catch (error) {
      setFormateur(undefined);
      throw Error;
    }
  }, [uai]);

  const getGestionnaires = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/formateurs/${uai}/gestionnaires`);

      setGestionnaires(response);
    } catch (error) {
      setGestionnaires(undefined);
      throw Error;
    }
  }, [uai, setGestionnaires]);

  const reload = useCallback(async () => {
    await getFormateur();
    await getGestionnaires();
  }, [getFormateur, getGestionnaires]);

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

  useEffect(() => {
    if (gestionnaires?.length === 1) {
      const gestionnaire = gestionnaires[0];
      navigate(`/admin/gestionnaire/${gestionnaire.siret}/formateur/${formateur.uai}`, { replace: true });
    }
  }, [gestionnaires, navigate, formateur?.uai]);

  if (!formateur) {
    return;
  }

  return (
    <>
      <Page
        title={
          <>
            Organisme formateur :&nbsp;
            <FormateurLibelle formateur={formateur} /> / liste des organismes responsables associés
          </>
        }
      >
        <Box mb={12}>
          <Text mb={4}>
            <strong>
              Voici la listes des organismes responsables pour lesquels l'organisme dispense des formations.
            </strong>
          </Text>
        </Box>

        <Box mb={12}>
          {gestionnaires && (
            <Table mt={12}>
              <Thead>
                <Tr>
                  <Th width="80px"></Th>

                  <Th width="450px">Raison sociale / Ville</Th>
                  <Th width="350px">Courriel habilité</Th>

                  <Th width={"80px"}>Candidats</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {gestionnaires.map((gestionnaire) => {
                  const etablissement = gestionnaire.etablissements?.find(
                    (etablissement) => etablissement.uai === formateur.uai
                  );
                  return (
                    <Tr key={gestionnaire?.uai}>
                      <Td>
                        <Link
                          variant="primary"
                          href={`/admin/gestionnaire/${gestionnaire.siret}/formateur/${formateur.uai}`}
                        >
                          Détail
                        </Link>
                      </Td>
                      <Td>
                        <GestionnaireLibelle gestionnaire={gestionnaire} /> <OrganismeResponsableTag />
                      </Td>
                      <Td>
                        <GestionnaireEmail gestionnaire={gestionnaire} formateur={formateur} callback={reload} />
                      </Td>
                      <Td>
                        <Text>{etablissement?.nombre_voeux}</Text>
                      </Td>
                      <Td>
                        <GestionnaireStatut gestionnaire={formateur} formateur={formateur} />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
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

export default Gestionnaires;
