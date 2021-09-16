import React from "react";
import { DateTime } from "luxon";
import { Card, Grid, Page, Table } from "tabler-react";
import { useGet } from "../common/hooks/httpHooks";
import { buildLink } from "../common/httpClient";
import TablerIcon from "../common/components/TablerIcon";

function FichiersPage() {
  let [fichiers, loading] = useGet("/api/fichiers", []);

  return (
    <Page>
      <Page.Main>
        <Page.Content title="Voeux Affelnet">
          <Grid.Row>
            <Grid.Col width={12}>
              <Card>
                <Card.Header>
                  <Card.Title>Téléchargement des voeux</Card.Title>
                </Card.Header>
                <Card.Body>
                  <p>En cliquant directement sur le fichier ci-dessous vous pouvez télécharger les voeux.</p>
                  <p>En cas de nouvelle émission de voeux sur votre UAI, vous recevrez une notification par email.</p>
                  <p>
                    Si vous utilisez Ymag et que vous souhaitez intégrer les voeux à cet outil, vous trouverez plus
                    d’informations ici :
                    <a href="https://learn.ymag.fr/course/view.php?id=44235">
                      https://learn.ymag.fr/course/view.php?id=44235
                    </a>
                  </p>
                  <p>
                    Si vous utilisez IGesti et que vous souhaitez intégrer les voeux à cet outil, vous trouverez plus
                    d’informations ici :
                    <a href="/docs/03bis_Mode_Op_GESTI_Importation.pdf">Mode_Op_GESTI_Importation.pdf</a>
                  </p>
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>{" "}
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
                      <Table.ColHeader>Nom</Table.ColHeader>
                      <Table.ColHeader>Date de mise à jour</Table.ColHeader>
                      <Table.ColHeader>Informations</Table.ColHeader>
                    </Table.Header>
                    <Table.Body>
                      {fichiers.map(({ name, lastDownloadDate, date }) => {
                        let link = buildLink(`/api/fichiers/${name}`);

                        let downloadDate = DateTime.fromISO(lastDownloadDate)
                          .setLocale("fr")
                          .toFormat("cccc dd LLLL yyyy à HH:mm");
                        return (
                          <Table.Row key={name}>
                            <Table.Col>
                              <a target={"_blank"} rel={"noopener noreferrer"} href={link}>
                                <TablerIcon name="download" />
                                <span>{name}</span>
                              </a>
                            </Table.Col>
                            <Table.Col>
                              <div>{DateTime.fromISO(date).setLocale("fr").toFormat("cccc dd LLLL yyyy à HH:mm")}</div>
                            </Table.Col>
                            <Table.Col>
                              {lastDownloadDate ? (
                                <div>Téléchargé le {downloadDate}</div>
                              ) : (
                                <span>
                                  <TablerIcon name="bell" />
                                  Ce fichier contient des nouveaux voeux ou des corrections que vous n'avez pas encore
                                  téléchargé
                                </span>
                              )}
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

export default FichiersPage;
