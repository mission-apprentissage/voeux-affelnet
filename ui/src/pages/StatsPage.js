import { useCallback, useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { useFetch } from "../common/hooks/useFetch";
import { Page } from "../common/components/layout/Page";
import {
  Box,
  Heading,
  Select,
  Stat,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Divider,
  Table,
  Thead,
  Td,
  Tbody,
  Tr,
  Th,
} from "@chakra-ui/react";
import { useGet } from "../common/hooks/httpHooks";

function StatsPage() {
  const [academies] = useGet("/api/constant/academies", []);

  const [globalStats, globalStatsLoading, , setGlobalStats] = useFetch(`/api/stats/computeStats/now`, null);
  const [organismes, setOrganismes] = useState(undefined);
  const [voeux, setVoeux] = useState(undefined);
  const [progresses, setProgresses] = useState(undefined);

  const selectAcademie = useCallback(
    ({ academie }) => {
      if (!academie.length) {
        academie = "ALL";
      }
      if (globalStats) {
        setOrganismes(globalStats.stats?.organismes?.find((s) => s.code === academie)?.stats);
        setVoeux(globalStats.stats?.voeux?.find((s) => s.code === academie)?.stats);
        setProgresses(globalStats.stats?.progresses?.find((s) => s.code === academie)?.stats);
      }
    },
    [globalStats, setOrganismes, setVoeux, setProgresses]
  );

  useEffect(() => {
    if (globalStats) {
      selectAcademie({ academie: "ALL" });
    }
  }, [globalStats, selectAcademie]);

  return (
    <Page title="Statistiques">
      {globalStatsLoading && <div>En cours de chargement...</div>}
      {!globalStatsLoading && (
        <>
          <Box mb={8}>
            <Formik
              enableReinitialize
              initialValues={
                {
                  // ...(self?.academies?.length === 1 ? { academie: self?.academies[0].code } : {}),
                }
              }
              onSubmit={selectAcademie}
              onChange={selectAcademie}
            >
              {({ handleSubmit, handleChange, values, submitForm }) => {
                return (
                  <Form id="search">
                    <Field name="academie">
                      {({ field }) => {
                        return (
                          <Select
                            style={{ width: "100%" }}
                            placeholder={"Académie (toutes)"}
                            // disabled={self.academies?.length === 1}
                            {...field}
                            onChange={(value) => {
                              handleChange(value);
                              handleSubmit(value);
                            }}
                          >
                            {academies.map((academie) => (
                              <option
                                key={academie.code}
                                value={academie.code}
                                // disabled={
                                //   self.academies?.length &&
                                //   !self.academies.map((academie) => academie.code).includes(academie.code)
                                // }
                              >
                                {academie.nom}
                              </option>
                            ))}
                          </Select>
                        );
                      }}
                    </Field>
                  </Form>
                );
              }}
            </Formik>
          </Box>
          <Box>
            <Heading as="h4" size="md" mb={8}>
              Organismes
            </Heading>
            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Nombre d'organismes responsables</StatLabel>
                <StatNumber>{organismes?.totalGestionnaire}</StatNumber>
                Dont {organismes?.totalGestionnaireMultiOrganismes} responsables multi-organismes
              </Stat>

              <Stat>
                <StatLabel>Nombre d'établissements formateurs</StatLabel>
                <StatNumber>{organismes?.totalFormateur}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Nombre d'établissements d'accueil</StatLabel>
                <StatNumber>{organismes?.totalAccueil}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>
          <Divider m={8} />
          <Box>
            <Heading as="h4" size="md" mb={8}>
              Délégations
            </Heading>

            <StatGroup mb={4}>
              <Stat>
                <StatLabel>
                  Responsables ayant procédé à au moins une <br />
                  délégation de droit de réception des listes de candidats
                </StatLabel>
                <StatNumber>{organismes?.totalGestionnaireAvecDelegation}</StatNumber>

                <StatHelpText>
                  (soit{" "}
                  {
                    +(
                      (organismes?.totalGestionnaireAvecDelegation * 100) /
                      organismes?.totalGestionnaireMultiOrganismes
                    ).toFixed(2)
                  }
                  % des responsables multi-organismes)
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  Formateurs ayant reçu une délégation de <br />
                  droit de réception des listes de candidats
                </StatLabel>
                <StatNumber>{organismes?.totalFormateurAvecDelegation}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>
          <Divider m={8} />
          <Box>
            <Heading as="h4" size="md" mb={8}>
              Candidatures
            </Heading>
            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Nombre de candidatures</StatLabel>
                <StatNumber>{voeux?.total}</StatNumber>
                <StatHelpText>et {voeux?.nbVoeuxNonDiffusable} non diffusables</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Nombre d'apprenants</StatLabel>
                <StatNumber>{voeux?.apprenants}</StatNumber>
              </Stat>

              {/* <Stat>
                <StatLabel>Responsables inconnus</StatLabel>
                <StatNumber>{voeux?.gestionnairesInconnus}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Formateurs inconnus</StatLabel>
                <StatNumber>{voeux?.formateursInconnus}</StatNumber>
              </Stat> */}
            </StatGroup>
          </Box>
          <Divider m={8} />
          <Box>
            <Heading as="h4" size="md" mb={8}>
              Téléchargements
            </Heading>

            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Nombre de candidatures téléchargées</StatLabel>
                <StatNumber>{voeux?.nbVoeuxDiffusésGestionnaire + voeux?.nbVoeuxDiffusésFormateur}</StatNumber>
                {(!!voeux?.nbVoeuxDiffusésGestionnaire || !!voeux?.nbVoeuxDiffusésFormateur) && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        ((voeux?.nbVoeuxDiffusésGestionnaire + voeux?.nbVoeuxDiffusésFormateur) * 100) /
                        voeux?.total
                      ).toFixed(2)
                    }
                    % de l’ensemble des candidature)
                  </StatHelpText>
                )}
              </Stat>

              <Stat>
                <StatLabel>Nombre de candidatures téléchargées par les responsables</StatLabel>
                <StatNumber>{voeux?.nbVoeuxDiffusésGestionnaire}</StatNumber>

                {!!voeux?.nbVoeuxDiffusésGestionnaire && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        (voeux?.nbVoeuxDiffusésGestionnaire * 100) /
                        (voeux?.nbVoeuxDiffusésGestionnaire + voeux?.nbVoeuxDiffusésFormateur)
                      ).toFixed(2)
                    }
                    % des candidatures téléchargées)
                  </StatHelpText>
                )}
              </Stat>

              <Stat>
                <StatLabel>Nombre de candidatures téléchargées par les délégués</StatLabel>
                <StatNumber>{voeux?.nbVoeuxDiffusésFormateur}</StatNumber>
                {!!voeux?.nbVoeuxDiffusésFormateur && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        (voeux?.nbVoeuxDiffusésFormateur * 100) /
                        (voeux?.nbVoeuxDiffusésGestionnaire + voeux?.nbVoeuxDiffusésFormateur)
                      ).toFixed(2)
                    }
                    % des candidatures téléchargées)
                  </StatHelpText>
                )}
              </Stat>
            </StatGroup>
          </Box>
          <Divider m={8} />

          <Box>
            <Heading as="h4" size="md" mb={8}>
              Avancement
            </Heading>

            <StatGroup mb={4}>
              <Stat>
                {/* Nombre d’organismes responsables n’ayant pas téléchargé leur(s) liste(s) : 173 (17,5%), pour 292 organismes formateurs et 13962 candidatures (11,5%) */}
                <StatLabel>Nombre d’organismes responsables n’ayant pas téléchargé leur(s) liste(s)</StatLabel>
                <StatNumber>
                  {+progresses?.noDownload?.nbGestionnaire} (
                  {+((progresses?.noDownload?.nbGestionnaire * 100) / organismes?.totalGestionnaire).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.noDownload?.nbFormateur} organismes formateurs (
                  {+((progresses?.noDownload?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}
                  %) et {+progresses?.noDownload?.nbVoeux} candidatures (
                  {+((progresses?.noDownload?.nbVoeux * 100) / voeux?.total).toFixed(2)}
                  %)
                </StatHelpText>
              </Stat>

              <Stat>
                {/* Nombre d’organismes responsables n’ayant pas téléchargé la dernière mise à jour de leur(s) liste(s) : 163 (16,5%), pour 283 organismes formateurs et 5682 candidatures (4,7%) */}
                <StatLabel>
                  Nombre d’organismes responsables n’ayant pas téléchargé la dernière mise à jour de leur(s) liste(s)
                </StatLabel>
                <StatNumber>
                  {progresses?.partialDownload?.nbGestionnaire} (
                  {+((progresses?.partialDownload?.nbGestionnaire * 100) / organismes?.totalGestionnaire).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.partialDownload?.nbFormateur} organismes formateurs (
                  {+((progresses?.partialDownload?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}
                  %) et {progresses?.partialDownload?.nbVoeux} candidatures (
                  {+((progresses?.partialDownload?.nbVoeux * 100) / voeux?.total).toFixed(2)}
                  %)
                </StatHelpText>
              </Stat>
            </StatGroup>

            <StatGroup mb={4}>
              <Stat>
                {/* Nombre d’organisme responsables ayant téléchargé l’intégralité des candidatures : 699 (70,7%), pour 1124 organismes formateurs et 83826 candidatures (69%) */}
                <StatLabel>Nombre d’organisme responsables ayant téléchargé l’intégralité des candidatures</StatLabel>

                <StatNumber>
                  {progresses?.fullDownload?.nbGestionnaire} (
                  {+((progresses?.fullDownload?.nbGestionnaire * 100) / organismes?.totalGestionnaire).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.fullDownload?.nbFormateur} organismes formateurs (
                  {+((progresses?.fullDownload?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}
                  %) et {progresses?.fullDownload?.nbVoeux} candidatures (
                  {+((progresses?.fullDownload?.nbVoeux * 100) / voeux?.total).toFixed(2)}
                  %)
                </StatHelpText>
              </Stat>

              <Stat>
                {/* Nombre d’organismes responsables sans candidatures : 54 (5,5%), pour 81 organismes formateurs. */}
                <StatLabel>Nombre d’organismes responsables sans candidatures</StatLabel>
                <StatNumber>
                  {progresses?.noVoeux?.nbGestionnaire} (
                  {+((progresses?.noVoeux?.nbGestionnaire * 100) / organismes?.totalGestionnaire).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.noVoeux?.nbFormateur} organismes formateurs (
                  {+((progresses?.noVoeux?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}%)
                </StatHelpText>
              </Stat>
            </StatGroup>
          </Box>

          <Divider m={8} />

          <Box mb={8}>
            <Heading as="h3" size="md" mb={8}>
              Répartition par académie
            </Heading>

            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Académie</Th>
                  <Th>Nombre d'organismes responsables</Th>
                  <Th>Nombre d'organismes formateurs</Th>
                  <Th>Nombre de candidatures</Th>
                  <Th>Nombre de candidatures téléchargées</Th>
                </Tr>
              </Thead>
              <Tbody>
                {academies.map((academie) => {
                  const organismes = globalStats?.stats?.organismes?.find((s) => s.code === academie.code)?.stats;
                  const voeux = globalStats?.stats?.voeux?.find((s) => s.code === academie.code)?.stats;

                  return (
                    <Tr key={academie.code}>
                      <Td>{academie.nom}</Td>
                      <Td>{organismes?.totalGestionnaire}</Td>
                      <Td>{organismes?.totalFormateur}</Td>
                      <Td>{voeux?.total}</Td>
                      <Td>
                        {voeux?.nbVoeuxDiffusésFormateur + voeux?.nbVoeuxDiffusésGestionnaire}{" "}
                        {voeux?.total > 0 && (
                          <>
                            (
                            <b>
                              {
                                +(
                                  ((voeux?.nbVoeuxDiffusésGestionnaire + voeux?.nbVoeuxDiffusésFormateur) * 100) /
                                  voeux?.total
                                ).toFixed(2)
                              }
                              %
                            </b>
                            )
                          </>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </>
      )}
    </Page>
  );
}

export default StatsPage;
