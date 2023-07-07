import { Form } from "tabler-react";
import { useFetch } from "../common/hooks/useFetch";
import { _get } from "../common/httpClient";
import { Page } from "../common/components/layout/Page";
import { Box, Heading, Select, Stat, StatGroup, StatHelpText, StatLabel, StatNumber, Divider } from "@chakra-ui/react";
import { Field, Formik } from "formik";
import { useGet } from "../common/hooks/httpHooks";

function StatsPage() {
  const [academies] = useGet("/api/constant/academies", []);

  const [now, loading, , setNow] = useFetch(`/api/stats/computeStats/now?academies=ALL`, null);

  const organismes = now ? now.stats.organismes[0].stats : null;
  const voeux = now ? now.stats.voeux[0].stats : null;

  async function fetchAcademieStats({ academie }) {
    try {
      const data = await _get(`/api/stats/computeStats/now?academies=${academie.length ? academie : "ALL"}`);
      setNow(data);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Page title="Statistiques">
      {loading && <div>En cours de chargement...</div>}
      {!loading && now && (
        <>
          <Box mb={8}>
            <Formik
              enableReinitialize
              initialValues={
                {
                  // ...(self?.academies?.length === 1 ? { academie: self?.academies[0].code } : {}),
                }
              }
              onSubmit={fetchAcademieStats}
              onChange={fetchAcademieStats}
            >
              {({ handleSubmit, handleChange, values, submitForm }) => {
                return (
                  <Form id="search">
                    <Field name="academie">
                      {({ field, setFieldValue, meta }) => {
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
            <Heading as="h3" size="md" mb={8}>
              Organismes
            </Heading>
            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Nombre d'organismes responsables</StatLabel>
                <StatNumber>{organismes.totalGestionnaire}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Nombre d'établissements formateurs</StatLabel>
                <StatNumber>{organismes.totalFormateur}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Nombre d'établissements d'accueil</StatLabel>
                <StatNumber>{organismes.totalAccueil}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>

          <Divider m={8} />

          <Box>
            <Heading as="h3" size="md" mb={8}>
              Délégations
            </Heading>

            <StatGroup mb={4}>
              <Stat>
                <StatLabel>
                  Responsables ayant procédé à au moins une <br />
                  délégation de droit de réception des listes de candidats
                </StatLabel>
                <StatNumber>{organismes.totalGestionnaireAvecDelegation}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>
                  Formateurs ayant reçu une délégation de <br />
                  droit de réception des listes de candidats
                </StatLabel>
                <StatNumber>{organismes.totalFormateurAvecDelegation}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>

          <Divider m={8} />

          <Box>
            <Heading as="h3" size="md" mb={8}>
              Candidatures
            </Heading>
            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Nombre de candidatures</StatLabel>
                <StatNumber>{voeux.total}</StatNumber>
                <StatHelpText>et {voeux.nbVoeuxNonDiffusable} non diffusables</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Nombre d'apprenants</StatLabel>
                <StatNumber>{voeux.apprenants}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Responsables inconnus</StatLabel>
                <StatNumber>{voeux.gestionnairesInconnus}</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Formateurs inconnus</StatLabel>
                <StatNumber>{voeux.formateursInconnus}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>

          <Divider m={8} />

          <Box>
            <Heading as="h3" size="md" mb={8}>
              Téléchargements
            </Heading>

            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Nombre de candidatures téléchargées</StatLabel>
                <StatNumber>{voeux.nbVoeuxDiffusésGestionnaire + voeux.nbVoeuxDiffusésFormateur}</StatNumber>
                {(!!voeux.nbVoeuxDiffusésGestionnaire || !!voeux.nbVoeuxDiffusésFormateur) && (
                  <StatHelpText>
                    (soit{" "}
                    {
                      +(
                        ((voeux.nbVoeuxDiffusésGestionnaire + voeux.nbVoeuxDiffusésFormateur) * 100) /
                        voeux.total
                      ).toFixed(2)
                    }
                    %)
                  </StatHelpText>
                )}
              </Stat>

              <Stat>
                <StatLabel>Nombre de candidatures téléchargées par les responsables</StatLabel>
                <StatNumber>{voeux.nbVoeuxDiffusésGestionnaire}</StatNumber>

                {!!voeux.nbVoeuxDiffusésGestionnaire && (
                  <StatHelpText>
                    (soit {+((voeux.nbVoeuxDiffusésGestionnaire * 100) / voeux.total).toFixed(2)}%)
                  </StatHelpText>
                )}
              </Stat>

              <Stat>
                <StatLabel>Nombre de candidatures téléchargées par les délégués</StatLabel>
                <StatNumber>{voeux.nbVoeuxDiffusésFormateur}</StatNumber>
                {!!voeux.nbVoeuxDiffusésFormateur && (
                  <StatHelpText>
                    (soit {+((voeux.nbVoeuxDiffusésFormateur * 100) / voeux.total).toFixed(2)}%)
                  </StatHelpText>
                )}
              </Stat>
            </StatGroup>
          </Box>
        </>
      )}
    </Page>
  );
}

export default StatsPage;
