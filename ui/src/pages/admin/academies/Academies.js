import { useGet } from "../../../common/hooks/httpHooks";
import React from "react";
import { Card, CardHeader, CardBody, Heading, Table, Thead, Tbody, Tr, Td } from "@chakra-ui/react";

function Academies() {
  const [academies, loading] = useGet("/api/admin/academies", []);

  return (
    <Card mb={8}>
      <CardHeader>
        <Heading as="h3" size="md">
          Académies
        </Heading>
      </CardHeader>
      <CardBody>
        {loading && <div>En cours de chargement...</div>}
        <Table cards={true} striped={true} responsive={true} className="table-vcenter">
          <Thead>
            <Td>Nom</Td>
            <Td>Nombre de consultations de la page stats</Td>
          </Thead>
          <Tbody>
            {academies.map(({ code, nom, nbConsultationStats }) => {
              return (
                <Tr key={code}>
                  <Td>{nom}</Td>
                  <Td>{nbConsultationStats}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}

export default Academies;
