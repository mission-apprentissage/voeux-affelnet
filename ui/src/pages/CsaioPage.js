import React from "react";
import { Card, Grid, Page, Table } from "tabler-react";
import { useGet } from "../common/hooks/httpHooks";
import { buildLink } from "../common/httpClient";
import TablerIcon from "../common/components/TablerIcon";
import { DateTime } from "luxon";

function CsaioPage() {
  const [fichiers, loading] = useGet("/api/csaio/fichiers", []);

  return (
    <Page>
      <Page.Main>
        <Page.Content title="Voeux Affelnet">
          {" "}
          <Grid.Row>
            <Grid.Col width={12}>
              <Card>
                <Card.Header>
                  <Card.Title>Fichiers</Card.Title>
                </Card.Header>
                <Card.Body>
                  {loading && <div>En cours de chargement...</div>}
                  <Table cards={true} striped={true} responsive={true} className="table-vcenter">
                    <Table.Header>
                      <Table.ColHeader>Nom du fichier</Table.ColHeader>
                      <Table.ColHeader>Date de mise à jour</Table.ColHeader>
                    </Table.Header>
                    <Table.Body>
                      {fichiers.map(({ name, date }, index) => {
                        const link = buildLink(`/api/csaio/fichiers/${name}`);

                        return (
                          <Table.Row key={index}>
                            <Table.Col>
                              <a target={"_blank"} rel={"noopener noreferrer"} href={link}>
                                <TablerIcon name="download" />
                                <span>{name}</span>
                              </a>
                            </Table.Col>
                            <Table.Col>
                              <div>{DateTime.fromISO(date).setLocale("fr").toFormat("cccc dd LLLL yyyy à HH:mm")}</div>
                            </Table.Col>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
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
