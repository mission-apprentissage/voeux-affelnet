import React, { useState } from "react";
import { Card, Form, Grid, Page, Table } from "tabler-react";
import { useGet } from "../common/hooks/httpHooks";
import { buildLink } from "../common/httpClient";
import TablerIcon from "../common/components/TablerIcon";
import { DateTime } from "luxon";
import { useFetch } from "../common/hooks/useFetch.js";
import { useTimeout } from "../common/hooks/useTimeout.js";

function AcademieSelector({ onChange }) {
  const [academies] = useFetch(`/api/csaio/academies`, []);
  const defaults = { code: null, nom: "Toutes" };

  return (
    <Form.Group label={"Académies"}>
      <Form.Select onChange={(e) => onChange(e.target.value)}>
        {[defaults, ...academies].map((item) => {
          return (
            <option key={item.code} value={item.code}>
              {item.nom}
            </option>
          );
        })}
      </Form.Select>
    </Form.Group>
  );
}

function CsaioPage() {
  const [fichiers, pending] = useGet("/api/csaio/fichiers", []);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({});

  useTimeout(() => setLoading(false), 500);

  return (
    <Page>
      <Page.Main>
        <Page.Content title="Voeux Affelnet">
          <Grid.Row>
            <Grid.Col width={12}>
              <Card>
                <Card.Header>
                  <Card.Title>Fichiers</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Grid.Row>
                    <Grid.Col width={4}>
                      <AcademieSelector
                        onChange={(code) => {
                          setLoading(true);
                          setParams({ academies: [code] });
                        }}
                      />
                    </Grid.Col>
                  </Grid.Row>
                  {loading || pending ? (
                    <div>En cours de chargement...</div>
                  ) : (
                    <Table cards={true} striped={true} responsive={true} className="table-vcenter">
                      <Table.Header>
                        <Table.ColHeader>Nom du fichier</Table.ColHeader>
                        <Table.ColHeader>Date de mise à jour</Table.ColHeader>
                      </Table.Header>
                      <Table.Body>
                        {fichiers.map(({ name, date }, index) => {
                          const link = buildLink(`/api/csaio/fichiers/${name}`, params);

                          return (
                            <Table.Row key={index}>
                              <Table.Col>
                                <a target={"_blank"} rel={"noopener noreferrer"} href={link}>
                                  <TablerIcon name="download" />
                                  <span>{name}</span>
                                </a>
                              </Table.Col>
                              <Table.Col>
                                <div>
                                  {DateTime.fromISO(date).setLocale("fr").toFormat("cccc dd LLLL yyyy à HH:mm")}
                                </div>
                              </Table.Col>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default CsaioPage;
