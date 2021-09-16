import { Card, Grid, Icon, Table } from "tabler-react";
import React from "react";
import { buildLink } from "../../common/httpClient";

function File({ name, link }) {
  return (
    <Table.Row>
      <Table.Col className="w-1">
        <Icon name="file" />
      </Table.Col>
      <Table.Col>
        <a target={"_blank"} rel={"noopener noreferrer"} href={link}>
          {name}
        </a>
      </Table.Col>
      <Table.Col alignContent={"right"}>
        <a target={"_blank"} rel={"noopener noreferrer"} href={link}>
          <Icon name="download" link={false} />
        </a>
      </Table.Col>
    </Table.Row>
  );
}

function Exports() {
  return (
    <Grid.Row>
      <Grid.Col width={12}>
        <Card>
          <Card.Header>
            <Card.Title>Exports</Card.Title>
          </Card.Header>
          <Card.Body>
            <Table cards={true} striped={true} responsive={true} className="table-vcenter">
              <Table.Body>
                <File name="CFA injoignables (csv)" link={buildLink(`/api/admin/cfas/injoinables.csv`)} />
                <File name="CFA inconnus (csv)" link={buildLink(`/api/admin/cfas/inconnus.csv`)} />
                <File name="CFA à relancer (csv)" link={buildLink(`/api/admin/cfas/relances.csv`)} />
              </Table.Body>
            </Table>
          </Card.Body>
        </Card>
      </Grid.Col>
    </Grid.Row>
  );
}

export default Exports;
