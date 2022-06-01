import React from "react";
import { DateTime } from "luxon";
import { Card, Grid, Page, Table } from "tabler-react";
import { useGet } from "../common/hooks/httpHooks";
import { buildLink } from "../common/httpClient";
import TablerIcon from "../common/components/TablerIcon";

function FichiersPage() {
  const [fichiers, loading] = useGet("/api/fichiers", []);

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
                  <p>
                    Chaque fichier téléchargeable ci-dessous contient les vœux exprimés sur Affelnet par l'établissement
                    d'accueil des futurs apprentis.
                  </p>
                  <p>
                    En cas de nouvelle émission de vœux sur votre établissement ou sur les établissements d’accueil dont
                    vous êtes responsable, vous recevrez une notification par email la semaine du 20 juin 2022 puis la
                    semaine du 4 juillet 2022. Les nouveaux fichiers mis à votre disposition reprendront alors
                    l’intégralité des vœux exprimés jusqu’à ces dates.
                  </p>
                  <p>
                    Information importante : les établissements d’accueil ne sont pas habilités à accéder à cette page
                    de téléchargement. Il est du ressort des responsables d’établissements d’accueil de leur transmettre
                    les listes de vœux.
                  </p>
                  <ul>
                    <li>
                      Si vous utilisez Ymag, et que vous souhaitez intégrer les vœux à cet outil, vous trouverez plus
                      d’informations ici :{" "}
                      <a href="https://learn.ymag.fr/course/view.php?id=44235">
                        https://learn.ymag.fr/course/view.php?id=44235
                      </a>
                    </li>
                    <li>
                      Si vous utilisez IGesti, et que vous souhaitez intégrer les vœux à cet outil, vous trouverez plus
                      d’informations ici :{" "}
                      <a href="/docs/03bis_Mode_Op_GESTI_Importation.pdf">Mode_Op_GESTI_Importation.pdf</a>
                    </li>
                    <li>
                      Si votre établissement est responsable d’établissements d’accueil, chaque établissement doit
                      procéder à cette intégration. Nous vous invitons à leur transmettre la notice correspondante s’ils
                      sont concernés.
                    </li>
                  </ul>
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
                      <Table.ColHeader>Nom du fichier</Table.ColHeader>
                      <Table.ColHeader>Raison sociale de l'établissement</Table.ColHeader>
                      <Table.ColHeader>Date de mise à jour</Table.ColHeader>
                      <Table.ColHeader>Informations</Table.ColHeader>
                    </Table.Header>
                    <Table.Body>
                      {fichiers.map(({ name, lastDownloadDate, date, etablissement }, index) => {
                        const link = buildLink(`/api/fichiers/${name}`);

                        const downloadDate = DateTime.fromISO(lastDownloadDate)
                          .setLocale("fr")
                          .toFormat("cccc dd LLLL yyyy à HH:mm");
                        return (
                          <Table.Row key={index}>
                            <Table.Col>
                              <a target={"_blank"} rel={"noopener noreferrer"} href={link}>
                                <TablerIcon name="download" />
                                <span>{name}</span>
                              </a>
                            </Table.Col>
                            <Table.Col>{etablissement?.libelle_etablissement}</Table.Col>
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
