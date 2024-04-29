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
  const mounted = useRef(false);
  const { siret } = useParams();

  const [responsable, setResponsable] = useState(undefined);
  // const [formateurs, setFormateurs] = useState(undefined);
  // const [delegues, setDelegues] = useState(undefined);

  const getResponsable = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/responsables/${siret}`);
      setResponsable(response);
    } catch (error) {
      setResponsable(undefined);
      throw Error;
    }
  }, [siret]);

  // const getFormateurs = useCallback(async () => {
  //   try {
  //     const response = await _get(`/api/admin/responsables/${siret}/formateurs`);

  //     setFormateurs(response);
  //   } catch (error) {
  //     setFormateurs(undefined);
  //     throw Error;
  //   }
  // }, [siret, setFormateurs]);

  // const getDelegues = useCallback(async () => {
  //   try {
  //     const response = await _get(`/api/admin/responsables/${siret}/delegues`);

  //     setDelegues(response);
  //   } catch (error) {
  //     setDelegues(undefined);
  //     throw Error;
  //   }
  // }, [siret, setDelegues]);

  const reload = useCallback(async () => {
    await Promise.all([await getResponsable() /*, await getFormateurs(), await getDelegues()*/]);
  }, [getResponsable /*, getFormateurs, getDelegues*/]);

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
              Voici la listes des organismes formateurs pour lesquels l'organisme a été identifié comme responsable?.
            </strong>
          </Text>
        </Box>

        <Box mb={12}>
          {/* {formateurs && ( */}
          {!!responsable?.relations?.length && (
            <Table mt={12}>
              <Thead>
                <Tr>
                  <Th width="80px"></Th>

                  <Th width="450px">Raison sociale / Ville</Th>
                  <Th width="350px">Courriel habilité</Th>

                  <Th width={"70px"}>Candidats</Th>
                  <Th width={"70px"}>Restant à télécharger</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {responsable?.relations.map((relation) => {
                  const formateur = relation?.formateur ?? relation.etablissement_formateur;
                  const delegue = relation?.delegue;

                  return (
                    <Tr key={formateur?.uai}>
                      <Td>
                        <Link
                          variant="primary"
                          href={`/admin/responsable/${responsable?.siret}/formateur/${formateur?.uai}`}
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
                          <FormateurEmail
                            responsable={responsable}
                            formateur={formateur}
                            delegue={delegue}
                            callback={reload}
                          />
                        </Text>
                      </Td>
                      <Td>
                        <Text>{relation?.nombre_voeux.toLocaleString()}</Text>
                      </Td>
                      <Td>
                        <Text>{relation?.nombre_voeux_restant.toLocaleString()}</Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <FormateurStatut relation={relation} />
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
