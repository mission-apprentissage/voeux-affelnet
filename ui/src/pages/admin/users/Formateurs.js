import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Text, Box, Link, Tag, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../../common/components/admin/fields/FormateurEmail";
import { GestionnaireLibelle } from "../../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { _get } from "../../../common/httpClient";

export const Formateurs = ({}) => {
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

  return (
    <>
      <Page
        title={
          <>
            Organisme responsable :&nbsp;
            <GestionnaireLibelle gestionnaire={gestionnaire} /> / liste des organismes formateurs associés
          </>
        }
      >
        <Box mb={12}>
          <Text mb={4}>
            <strong>
              Voici la listes des organismes formateurs pour lesquels l'organisme a été identifié comme responsable.
            </strong>
          </Text>
        </Box>

        <Box mb={12}>
          {formateurs && (
            <Table mt={12}>
              <Thead>
                <Tr>
                  <Th width="80px"></Th>

                  <Th width="450px">Raison sociale / Ville</Th>
                  <Th width="350px">Courriel habilité</Th>

                  <Th width={"80px"}>Candidats 2023</Th>
                  <Th>Statut d'avancement</Th>
                </Tr>
              </Thead>
              <Tbody>
                {formateurs.map((formateur) => {
                  const etablissement = gestionnaire.etablissements?.find(
                    (etablissement) => etablissement.uai === formateur.uai
                  );
                  return (
                    <Tr key={formateur?.uai}>
                      <Td>
                        <Link
                          variant="primary"
                          href={`/admin/gestionnaire/${gestionnaire.siret}/formateur/${formateur.uai}`}
                        >
                          Détail
                        </Link>
                      </Td>
                      <Td>
                        <FormateurLibelle formateur={formateur} /> <Tag>Formateur</Tag>
                      </Td>
                      <Td>
                        <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} callback={reload} />
                      </Td>
                      <Td>
                        <Text>{etablissement?.nombre_voeux}</Text>
                      </Td>
                      <Td>
                        <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
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
