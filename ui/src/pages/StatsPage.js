import React from "react";
import { Card, Form, Grid, Page, Table } from "tabler-react";
import { useFetch } from "../common/hooks/useFetch";
import { DateTime } from "luxon";
import styled from "styled-components";
import { _get } from "../common/httpClient";

export const StatsCard = styled(({ children, ...rest }) => {
  return (
    <Card {...rest}>
      <Card.Body className="stats">{children}</Card.Body>
    </Card>
  );
})`
  height: 75%;
  .stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .value {
      font-size: 1.5rem;
      font-weight: 600;
    }
    .details {
      font-size: 0.9rem;
      font-weight: 400;
    }
  }
`;

const AcademiesWrapper = styled.div`
  border: 1px solid rgba(0, 40, 100, 0.12);
  border-radius: 3px;
  padding: 1rem;
  margin-bottom: 2rem;
  .row,
  h4 {
    padding-left: 0.5rem;
  }
  select {
    width: 25%;
  }
`;

function StatsPage() {
  const [now, loading, , setNow] = useFetch(`/api/stats/computeStats/now?academies=ALL`, null);
  const [importCfas] = useFetch(`/api/stats/importCfas`, { results: [] });
  const [importVoeux] = useFetch(`/api/stats/importVoeux`, { results: [] });

  const academies = now ? now._meta.academies : [];
  const cfas = now ? now.stats.cfas[0].stats : null;
  const emails = now ? now.stats.emails[0].stats : null;
  const téléchargements = now ? now.stats.téléchargements[0].stats : null;
  const voeux = now ? now.stats.voeux[0].stats : null;

  async function fetchAcademieStats(code) {
    try {
      const data = await _get(`/api/stats/computeStats/now?academies=${code}`);
      setNow(data);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Page>
      <Page.Main>
        <Page.Content title={<div>Voeux Affelnet - Statistiques</div>}>
          {loading && <div>En cours de chargement...</div>}
          {!loading && now && (
            <AcademiesWrapper>
              <Form.Group label={<h3>Académies</h3>}>
                <Form.Select onChange={(e) => fetchAcademieStats(e.target.value)}>
                  {academies.map((item) => {
                    return (
                      <option key={item.code} value={item.code}>
                        {item.nom}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>

              <h4>Voeux</h4>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre de voeux</div>
                    <div className="value">{voeux.total}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre d'apprenants</div>
                    <div className="value">{voeux.apprenants}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Cfas inconnus</div>
                    <div className="value">{voeux.cfasInconnus}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre voeux téléchargés</div>
                    <div className="value">{voeux.nbVoeuxDiffusés}</div>
                    {!!voeux.nbVoeuxDiffusés && (
                      <div className="details">(soit {Math.round((voeux.nbVoeuxDiffusés * 100) / voeux.total)}%)</div>
                    )}
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>

              <h4>CFA</h4>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Total</div>
                    <div className="value">{cfas.total}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Cfas activés</div>
                    <div className="value">{cfas.activés}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Cfas confirmés</div>
                    <div className="value">{cfas.confirmés}</div>
                    <div className="details">({cfas.confirmésAvecVoeux} avec voeux)</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Cfas en attente</div>
                    <div className="value">{cfas.enAttente}</div>
                    <div className="details">({cfas.enAttenteAvecVoeux} avec voeux)</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Cfas injoignables</div>
                    <div className="value">{cfas.injoinables}</div>
                    <div className="details">({cfas.injoinablesAvecVoeux} avec voeux)</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Cfas désinscrits</div>
                    <div className="value">{cfas.désinscrits}</div>
                    <div className="details">({cfas.désinscritsAvecVoeux} avec voeux)</div>
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>

              <h4>Téléchargements</h4>
              <Grid.Row>
                <Card>
                  <Card.Body>
                    <Table>
                      <Table.Header>
                        <Table.ColHeader>Extraction</Table.ColHeader>
                        <Table.ColHeader>Téléchargés</Table.ColHeader>
                      </Table.Header>
                      <Table.Body>
                        {téléchargements.map((stats, index) => {
                          return (
                            <Table.Row key={index}>
                              <Table.Col>
                                {DateTime.fromISO(stats.import_date).setLocale("fr").toFormat("yyyy-MM-dd")}
                              </Table.Col>
                              <Table.Col>{stats.total}</Table.Col>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  </Card.Body>
                </Card>
              </Grid.Row>

              {emails.length > 0 && (
                <>
                  <h4>Emails</h4>
                  <Grid.Row>
                    <Grid.Col width={12}>
                      <Card>
                        <Card.Body>
                          <Table>
                            <Table.Header>
                              <Table.ColHeader>Type</Table.ColHeader>
                              <Table.ColHeader>Envoyés</Table.ColHeader>
                              <Table.ColHeader>Ouverts</Table.ColHeader>
                              <Table.ColHeader>Relances</Table.ColHeader>
                            </Table.Header>
                            <Table.Body>
                              {emails.map((stats, index) => {
                                return (
                                  <Table.Row key={index}>
                                    <Table.Col>{stats._id}</Table.Col>
                                    <Table.Col>{stats.nbEnvoyés}</Table.Col>
                                    <Table.Col>{stats.nbOuverts}</Table.Col>
                                    <Table.Col>{stats.nbRelances}</Table.Col>
                                  </Table.Row>
                                );
                              })}
                            </Table.Body>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Grid.Col>
                  </Grid.Row>
                </>
              )}
            </AcademiesWrapper>
          )}

          {!loading && importVoeux.results.length > 0 && importCfas.results.length > 0 && (
            <>
              <h3>Imports</h3>
              <Grid.Row>
                <Grid.Col width={12}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Import des voeux</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Table>
                        <Table.Header>
                          <Table.ColHeader>Extraction</Table.ColHeader>
                          <Table.ColHeader>Total</Table.ColHeader>
                          <Table.ColHeader>Nouveaux</Table.ColHeader>
                          <Table.ColHeader>Mises à jour</Table.ColHeader>
                          <Table.ColHeader>Supprimés</Table.ColHeader>
                          <Table.ColHeader>Invalides</Table.ColHeader>
                          <Table.ColHeader>Erreurs</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {importVoeux.results.map((res, index) => {
                            return (
                              <Table.Row key={index}>
                                <Table.Col>{DateTime.fromISO(res.date).toISODate()}</Table.Col>
                                <Table.Col>{res.stats.total}</Table.Col>
                                <Table.Col>{res.stats.created}</Table.Col>
                                <Table.Col>{res.stats.updated}</Table.Col>
                                <Table.Col>{res.stats.deleted}</Table.Col>
                                <Table.Col>{res.stats.invalid}</Table.Col>
                                <Table.Col>{res.stats.failed}</Table.Col>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table>
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row>
                <Grid.Col width={12}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Import des cfas</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Table>
                        <Table.Header>
                          <Table.ColHeader>Date</Table.ColHeader>
                          <Table.ColHeader>Total</Table.ColHeader>
                          <Table.ColHeader>Nouveaux</Table.ColHeader>
                          <Table.ColHeader>Mises à jour</Table.ColHeader>
                          <Table.ColHeader>Invalides</Table.ColHeader>
                          <Table.ColHeader>Erreurs</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {importCfas.results.map((res, index) => {
                            return (
                              <Table.Row key={index}>
                                <Table.Col>{DateTime.fromISO(res.date).toISODate()}</Table.Col>
                                <Table.Col>{res.stats.total}</Table.Col>
                                <Table.Col>{res.stats.created}</Table.Col>
                                <Table.Col>{res.stats.updated}</Table.Col>
                                <Table.Col>{res.stats.invalid}</Table.Col>
                                <Table.Col>{res.stats.failed}</Table.Col>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table>
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
            </>
          )}
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default StatsPage;
