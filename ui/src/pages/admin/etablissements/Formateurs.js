import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Text, Box, Link, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../../../common/components/responsable/fields/ResponsableLibelle";
import { FormateurEmail } from "../../../common/components/admin/fields/FormateurEmail";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { _get } from "../../../common/httpClient";
import { OrganismeFormateurTag } from "../../../common/components/tags/OrganismeFormateur";

export const Formateurs = () => {
  const { siret } = useParams();

  const [responsable, setResponsable] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const mounted = useRef(false);

  const getResponsable = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/responsables/${siret}`);
      setResponsable(response);
    } catch (error) {
      setResponsable(undefined);
      throw Error;
    }
  }, [siret]);

  const getFormateurs = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/responsables/${siret}/formateurs`);

      setFormateurs(response);
    } catch (error) {
      setFormateurs(undefined);
      throw Error;
    }
  }, [siret, setFormateurs]);

  const reload = useCallback(async () => {
    await getResponsable();
    await getFormateurs();
  }, [getResponsable, getFormateurs]);

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

  if (!responsable) {
    return;
  }

  return (
    <>
      <Page
        title={
          <>
            Organisme responsable :&nbsp;
            <ResponsableLibelle responsable={responsable} /> / liste des organismes formateurs associés
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

                  <Th width={"80px"}>Candidats</Th>
                  <Th width={"80px"}>Restant à télécharger</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {formateurs.map((formateur) => {
                  const etablissement = responsable.etablissements_formateur?.find(
                    (etablissement) => etablissement.uai === formateur.uai
                  );
                  return (
                    <Tr key={formateur?.uai}>
                      <Td>
                        <Link
                          variant="primary"
                          href={`/admin/responsable/${responsable.siret}/formateur/${formateur.uai}`}
                        >
                          Détail
                        </Link>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <FormateurLibelle formateur={formateur} /> <OrganismeFormateurTag />
                        </Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <FormateurEmail responsable={responsable} formateur={formateur} callback={reload} />
                        </Text>
                      </Td>
                      <Td>
                        <Text>{etablissement?.nombre_voeux}</Text>
                      </Td>
                      <Td>
                        <Text>{etablissement?.nombre_voeux_restant}</Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <FormateurStatut responsable={responsable} formateur={formateur} />
                        </Text>
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

export default Formateurs;
