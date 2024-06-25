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
              <Stat mr={2}>
                <StatLabel>Nombre d'organismes responsables</StatLabel>
                <StatNumber>{organismes?.totalResponsable?.toLocaleString()}</StatNumber>
                Dont {organismes?.totalResponsableMultiOrganismes?.toLocaleString()} responsables multi-organismes
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre d'établissements formateurs</StatLabel>
                <StatNumber>{organismes?.totalFormateur?.toLocaleString()}</StatNumber>
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre d’établissements d’accueil porteurs de candidatures</StatLabel>
                <StatNumber>{organismes?.totalAccueil?.toLocaleString()}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>

          <Divider m={8} />

          <Box>
            <Heading as="h4" size="md" mb={8}>
              Créations de compte
            </Heading>

            <StatGroup mb={8}>
              <Stat mr={2}>
                <StatLabel>Nombre d’organismes responsables qui n'ont pas confirmé leur adresse courriel </StatLabel>
                <StatNumber>
                  {(
                    organismes?.totalResponsable -
                    organismes?.totalResponsableActivated -
                    organismes?.totalResponsableConfirmed
                  )?.toLocaleString()}
                </StatNumber>
                <StatHelpText>
                  (soit{" "}
                  {
                    +(
                      ((organismes?.totalResponsable -
                        organismes?.totalResponsableActivated -
                        organismes?.totalResponsableConfirmed) *
                        100) /
                      organismes?.totalResponsable
                    ).toFixed(2)
                  }
                  % des responsables)
                </StatHelpText>
              </Stat>

              <Stat mr={2}>
                <StatLabel>
                  Nombre d’organismes responsables ayant confirmé leur adresse courriel mais n'ayant pas encore créé
                  leur mot de passe
                </StatLabel>
                <StatNumber>{organismes?.totalResponsableConfirmed?.toLocaleString()}</StatNumber>

                <StatHelpText>
                  (soit {+((organismes?.totalResponsableConfirmed * 100) / organismes?.totalResponsable).toFixed(2)}%
                  des responsables)
                </StatHelpText>
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre d’organismes responsables ayant finalisé la création de leur compte</StatLabel>
                <StatNumber>{organismes?.totalResponsableActivated?.toLocaleString()}</StatNumber>
                <StatHelpText>
                  (soit {+((organismes?.totalResponsableActivated * 100) / organismes?.totalResponsable).toFixed(2)}%
                  des responsables)
                </StatHelpText>
              </Stat>
            </StatGroup>

            <StatGroup mb={4}>
              <Stat mr={2}>
                <StatLabel>Nombre de personne ayant reçu une délégation</StatLabel>
                <StatNumber>{organismes?.totalDelegue?.toLocaleString()}</StatNumber>
              </Stat>

              <Stat mr={2}>
                <StatLabel>
                  {" "}
                  Nombre de personne ayant reçu une délégation mais n'ayant pas encore créé leur mot de passe
                </StatLabel>
                <StatNumber>
                  {organismes?.totalDelegue - organismes?.totalDelegueActivated?.toLocaleString()}
                </StatNumber>
                <StatHelpText>
                  (soit{" "}
                  {
                    +(
                      ((organismes?.totalDelegue - organismes?.totalDelegueActivated) * 100) /
                      organismes?.totalDelegue
                    ).toFixed(2)
                  }
                  % des personnes déléguées)
                </StatHelpText>
              </Stat>

              <Stat mr={2}></Stat>
            </StatGroup>
          </Box>

          <Divider m={8} />

          <Box>
            <Heading as="h4" size="md" mb={8}>
              Délégations
            </Heading>

            <StatGroup mb={4}>
              <Stat mr={2}>
                <StatLabel>
                  Responsables ayant procédé à au moins une <br />
                  délégation de droit de réception des listes de candidats
                </StatLabel>
                <StatNumber>{organismes?.totalResponsableAvecDelegation?.toLocaleString()}</StatNumber>

                <StatHelpText>
                  (soit{" "}
                  {+((organismes?.totalResponsableAvecDelegation * 100) / organismes?.totalResponsable).toFixed(2)}% des
                  responsables)
                </StatHelpText>
              </Stat>

              <Stat mr={2}>
                <StatLabel>
                  Formateurs pour lesquels une délégation de <br />
                  droit de réception des listes de candidats a été accordée
                </StatLabel>
                <StatNumber>{organismes?.totalFormateurAvecDelegation?.toLocaleString()}</StatNumber>
              </Stat>

              <Stat mr={2}></Stat>
            </StatGroup>
          </Box>
          <Divider m={8} />
          <Box>
            <Heading as="h4" size="md" mb={8}>
              Candidatures
            </Heading>
            <StatGroup mb={4}>
              <Stat mr={2}>
                <StatLabel>Nombre de candidatures</StatLabel>
                <StatNumber>{voeux?.total?.toLocaleString()}</StatNumber>
                <StatHelpText>dont {voeux?.totalRecensement?.toLocaleString()} voeux de recensement</StatHelpText>
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre de candidatures diffusables</StatLabel>
                <StatNumber>{voeux?.totalDiffusable?.toLocaleString()}</StatNumber>
                <StatHelpText>et {voeux?.totalNonDiffusable?.toLocaleString()} non diffusables</StatHelpText>
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre de candidats</StatLabel>
                <StatNumber>{voeux?.apprenants?.toLocaleString()}</StatNumber>
              </Stat>

              {/* <Stat mr={2}></Stat> */}

              {/* <Stat mr={2}>
                <StatLabel>Responsables inconnus</StatLabel>
                <StatNumber>{voeux?.responsablesInconnus}</StatNumber>
              </Stat>

              <Stat mr={2}>
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
              <Stat mr={2}>
                <StatLabel>Nombre de candidatures téléchargées</StatLabel>
                <StatNumber>{voeux?.nbVoeuxDiffusés?.toLocaleString()}</StatNumber>
                {!!voeux?.nbVoeuxDiffusés && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        ((voeux?.nbVoeuxDiffusésResponsable + voeux?.nbVoeuxDiffusésFormateur) * 100) /
                        voeux?.totalDiffusable
                      ).toFixed(2)
                    }
                    % de l’ensemble des candidatures)
                  </StatHelpText>
                )}
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre de candidatures téléchargées par les responsables</StatLabel>
                <StatNumber>{voeux?.nbVoeuxDiffusésResponsable?.toLocaleString()}</StatNumber>

                {!!voeux?.nbVoeuxDiffusésResponsable && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        (voeux?.nbVoeuxDiffusésResponsable * 100) /
                        (voeux?.nbVoeuxDiffusésResponsable + voeux?.nbVoeuxDiffusésFormateur)
                      ).toFixed(2)
                    }
                    % des candidatures téléchargées)
                  </StatHelpText>
                )}
              </Stat>

              <Stat mr={2}>
                <StatLabel>Nombre de candidatures téléchargées par les délégués</StatLabel>
                <StatNumber>{voeux?.nbVoeuxDiffusésFormateur?.toLocaleString()}</StatNumber>
                {!!voeux?.nbVoeuxDiffusésFormateur && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        (voeux?.nbVoeuxDiffusésFormateur * 100) /
                        (voeux?.nbVoeuxDiffusésResponsable + voeux?.nbVoeuxDiffusésFormateur)
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
              <Stat mr={2}>
                {/* Nombre d’organismes responsables n’ayant pas téléchargé leur(s) liste(s) : 173 (17,5%), pour 292 organismes formateurs et 13962 candidatures (11,5%) */}
                <StatLabel>Nombre d’organismes responsables n’ayant pas téléchargé leur(s) liste(s)</StatLabel>
                <StatNumber>
                  {+progresses?.noDownload?.nbResponsable} (
                  {+((progresses?.noDownload?.nbResponsable * 100) / organismes?.totalResponsable).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.noDownload?.nbFormateur?.toLocaleString()} organismes formateurs{" "}
                  {/*(
                  {+((progresses?.noDownload?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}
                  %)*/}{" "}
                  et {progresses?.noDownload?.nbVoeux?.toLocaleString()} candidatures{" "}
                  {/*(
                  {+((progresses?.noDownload?.nbVoeux * 100) / voeux?.total).toFixed(2)}
                  %)*/}
                </StatHelpText>
              </Stat>

              <Stat mr={2}>
                {/* Nombre d’organismes responsables n’ayant pas téléchargé la dernière mise à jour de leur(s) liste(s) : 163 (16,5%), pour 283 organismes formateurs et 5682 candidatures (4,7%) */}
                <StatLabel>
                  Nombre d’organismes responsables n’ayant pas téléchargé l’intégralité des candidatures (tous
                  formateurs et toutes mises à jour).
                </StatLabel>
                <StatNumber>
                  {progresses?.partialDownload?.nbResponsable} (
                  {+((progresses?.partialDownload?.nbResponsable * 100) / organismes?.totalResponsable).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.partialDownload?.nbFormateur?.toLocaleString()} organismes formateurs{" "}
                  {/*(
                 ({+((progresses?.partialDownload?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}
                  %)*/}{" "}
                  et {progresses?.partialDownload?.nbVoeux?.toLocaleString()} candidatures
                  {/* (
                  {/*({+((progresses?.partialDownload?.nbVoeux * 100) / voeux?.total).toFixed(2)}
                  %)*/}
                </StatHelpText>
              </Stat>

              <Stat mr={2}></Stat>
            </StatGroup>

            <StatGroup mb={4}>
              <Stat mr={2}>
                {/* Nombre d’organisme responsables ayant téléchargé l’intégralité des candidatures : 699 (70,7%), pour 1124 organismes formateurs et 83826 candidatures (69%) */}
                <StatLabel>Nombre d’organisme responsables ayant téléchargé l’intégralité des candidatures</StatLabel>

                <StatNumber>
                  {progresses?.fullDownload?.nbResponsable?.toLocaleString()} (
                  {+((progresses?.fullDownload?.nbResponsable * 100) / organismes?.totalResponsable).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.fullDownload?.nbFormateur?.toLocaleString()} organismes formateurs{" "}
                  {/*(
                  ({+((progresses?.fullDownload?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}
                  %)*/}{" "}
                  et {progresses?.fullDownload?.nbVoeux?.toLocaleString()} candidatures{" "}
                  {/*(
                  {({+((progresses?.fullDownload?.nbVoeux * 100) / voeux?.total).toFixed(2)}
                  %)*/}
                </StatHelpText>
              </Stat>

              <Stat mr={2}>
                {/* Nombre d’organismes responsables sans candidatures : 54 (5,5%), pour 81 organismes formateurs. */}
                <StatLabel>Nombre d’organismes responsables sans candidatures</StatLabel>
                <StatNumber>
                  {progresses?.noVoeux?.nbResponsable?.toLocaleString()} (
                  {+((progresses?.noVoeux?.nbResponsable * 100) / organismes?.totalResponsable).toFixed(2)}%)
                </StatNumber>

                <StatHelpText>
                  pour {progresses?.noVoeux?.nbFormateur?.toLocaleString()} organismes formateurs
                  {/* (
                  ({+((progresses?.noVoeux?.nbFormateur * 100) / organismes?.totalFormateur).toFixed(2)}%)*/}
                </StatHelpText>
              </Stat>

              <Stat mr={2}></Stat>
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
                  <Th>Ayant finalisé la création de leur compte</Th>
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
                      <Td>{organismes?.totalResponsable?.toLocaleString()}</Td>
                      <Td>
                        {organismes?.totalResponsableActivated?.toLocaleString()} (
                        {+((organismes?.totalResponsableActivated * 100) / organismes?.totalResponsable).toFixed(2)}%)
                      </Td>
                      <Td>{organismes?.totalFormateur?.toLocaleString()}</Td>
                      <Td>{voeux?.nbVoeux?.toLocaleString()}</Td>
                      <Td>
                        {voeux?.nbVoeuxDiffusés?.toLocaleString()}{" "}
                        {voeux?.nbVoeux > 0 && (
                          <>
                            (<b>{+((voeux?.nbVoeuxDiffusés * 100) / voeux?.nbVoeux).toFixed(2)}%</b>)
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
