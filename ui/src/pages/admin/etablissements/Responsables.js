import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Text, Box, Link, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../../../common/components/responsable/fields/ResponsableLibelle";
import { _get } from "../../../common/httpClient";
import { OrganismeResponsableTag } from "../../../common/components/tags/OrganismeResponsable";
import { ResponsableEmail } from "../../../common/components/admin/fields/ResponsableEmail";
import { ResponsableStatut } from "../../../common/components/admin/fields/ResponsableStatut";

export const Responsables = () => {
  const { uai } = useParams();
  const navigate = useNavigate();

  const [formateur, setFormateur] = useState(undefined);
  const [responsables, setResponsables] = useState(undefined);
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

  const getResponsables = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/formateurs/${uai}/responsables`);

      setResponsables(response);
    } catch (error) {
      setResponsables(undefined);
      throw Error;
    }
  }, [uai, setResponsables]);

  const reload = useCallback(async () => {
    await getFormateur();
    await getResponsables();
  }, [getFormateur, getResponsables]);

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
    if (responsables?.length === 1) {
      const responsable = responsables[0];
      navigate(`/admin/responsable/${responsable.siret}/formateur/${formateur.uai}`, { replace: true });
    }
  }, [responsables, navigate, formateur?.uai]);

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
          {responsables && (
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
                {responsables.map((responsable) => {
                  const etablissement = responsable.etablissements_formateur?.find(
                    (etablissement) => etablissement.uai === formateur.uai
                  );
                  return (
                    <Tr key={responsable?.uai}>
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
                          <ResponsableLibelle responsable={responsable} /> <OrganismeResponsableTag />
                        </Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <ResponsableEmail responsable={responsable} formateur={formateur} callback={reload} />
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
                          <ResponsableStatut responsable={responsable} formateur={formateur} />
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

export default Responsables;
