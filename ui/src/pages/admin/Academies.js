import { useGet } from "../../common/hooks/httpHooks";
import { Card, Grid, Table } from "tabler-react";
import React from "react";

function Academies() {
  let [academies, loading] = useGet("/api/admin/academies", []);

  return (
    <Grid.Row>
      <Grid.Col width={12}>
        <Card>
          <Card.Header>
            <Card.Title>Académies</Card.Title>
          </Card.Header>
          <Card.Body>
            {loading && <div>En cours de chargement...</div>}
            <Table cards={true} striped={true} responsive={true} className="table-vcenter">
              <Table.Header>
                <Table.ColHeader>Nom</Table.ColHeader>
                <Table.ColHeader>Nombre de consultations de la page stats</Table.ColHeader>
              </Table.Header>
              <Table.Body>
                {academies.map(({ code, nom, nbConsultationStats }) => {
                  return (
                    <Table.Row key={code}>
                      <Table.Col>{nom}</Table.Col>
                      <Table.Col>{nbConsultationStats}</Table.Col>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </Card.Body>
        </Card>
      </Grid.Col>
    </Grid.Row>
  );
}

export default Academies;
