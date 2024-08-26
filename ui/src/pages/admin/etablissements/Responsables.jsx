import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Text, Box, Link, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";

import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../../../common/components/responsable/fields/ResponsableLibelle";
import { _get } from "../../../common/httpClient";
import { OrganismeResponsableTag } from "../../../common/components/tags/OrganismeResponsable";
// import { ResponsableEmail } from "../../../common/components/admin/fields/ResponsableEmail";
import { ResponsableStatut } from "../../../common/components/admin/fields/ResponsableStatut";
import { FormateurEmail } from "../../../common/components/admin/fields/FormateurEmail";
import { Breadcrumb } from "../../../common/components/Breadcrumb";

export const Responsables = () => {
  const navigate = useNavigate();
  const { uai } = useParams();

  const [formateur, setFormateur] = useState(undefined);
  // const [responsables, setResponsables] = useState(undefined);
  // const [delegues, setDelegues] = useState(undefined);
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

  // const getResponsables = useCallback(async () => {
  //   try {
  //     const response = await _get(`/api/admin/formateurs/${uai}/responsables`);

  //     setResponsables(response);
  //   } catch (error) {
  //     setResponsables(undefined);
  //     throw Error;
  //   }
  // }, [uai, setResponsables]);

  // const getDelegues = useCallback(async () => {
  //   try {
  //     const response = await _get(`/api/admin/formateurs/${uai}/delegues`);

  //     setDelegues(response);
  //   } catch (error) {
  //     setDelegues(undefined);
  //     throw Error;
  //   }
  // }, [uai, setDelegues]);

  const reload = useCallback(async () => {
    await Promise.all([await getFormateur() /*, await getResponsables(), await getDelegues()*/]);
  }, [getFormateur /*, getResponsables, getDelegues*/]);

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
    if (formateur?.relations?.length === 1) {
      const responsable = formateur?.relations[0].responsable;
      navigate(`/admin/responsable/${responsable?.siret}/formateur/${formateur?.uai}`, { replace: true });
    }
  }, [formateur, navigate]);

  if (!formateur) {
    return;
  }

  const title = (
    <>
      Organisme formateur :&nbsp;
      <FormateurLibelle formateur={formateur} /> / liste des organismes responsables associés
    </>
  );

  return (
    <>
      <Breadcrumb
        items={[
          {
            label: (
              <>
                Organisme formateur :&nbsp;
                <FormateurLibelle formateur={formateur} />
              </>
            ),
            url: `/admin/formateur/${uai}`,
          },

          {
            label: <>Liste des organismes responsables associés</>,
            url: `/admin/formateur/${uai}/responsables`,
          },
        ]}
      />

      <Page title={title}>
        <Box mb={12}>
          {formateur?.relations && (
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
                {formateur?.relations.map((relation) => {
                  const responsable = relation.responsable ?? relation.etablissements_responsable;
                  const delegue = relation.delegue;

                  return (
                    <Tr key={responsable?.uai}>
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
                          <ResponsableLibelle responsable={responsable} /> <OrganismeResponsableTag />
                        </Text>
                      </Td>
                      <Td>
                        <Box lineHeight={6}>
                          <FormateurEmail
                            responsable={responsable}
                            formateur={formateur}
                            delegue={delegue}
                            callback={reload}
                          />
                        </Box>
                      </Td>
                      <Td>
                        <Text>{relation?.nombre_voeux.toLocaleString()}</Text>
                      </Td>
                      <Td>
                        <Text>{relation?.nombre_voeux_restant.toLocaleString()}</Text>
                      </Td>
                      <Td>
                        <Box lineHeight={6}>
                          <ResponsableStatut responsable={responsable} formateur={formateur} delegue={delegue} />
                        </Box>
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
