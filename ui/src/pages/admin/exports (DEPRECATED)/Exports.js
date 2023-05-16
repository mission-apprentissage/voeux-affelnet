import React from "react";
import { Card, CardHeader, CardBody, Heading, Table, Tbody, Tr, Td, Link } from "@chakra-ui/react";
import { buildLink } from "../../../common/httpClient";
import { FileDownloadLine } from "../../../theme/components/icons/FileDownloadLine";

function File({ name, link }) {
  return (
    <Tr>
      <Td>
        <Link target={"_blank"} rel={"noopener noreferrer"} href={link}>
          <FileDownloadLine mr={4} />
          {name}
        </Link>
      </Td>
    </Tr>
  );
}

function Exports() {
  return (
    <Card mb={8}>
      <CardHeader>
        <Heading as="h3" size="md">
          Exports
        </Heading>
      </CardHeader>
      <CardBody>
        <Table cards={true} striped={true} responsive={true} className="table-vcenter">
          <Tbody>
            <File name="CFA injoignables (csv)" link={buildLink(`/api/admin/fichiers/injoinables.csv`)} />
            <File name="CFA à relancer (csv)" link={buildLink(`/api/admin/fichiers/relances.csv`)} />
            <File name="Etablissements d'accueil inconnus (csv)" link={buildLink(`/api/admin/fichiers/inconnus.csv`)} />
            <File
              name="Statut de téléchargement des voeux (csv)"
              link={buildLink(`/api/admin/fichiers/statut-voeux.csv`)}
            />
            <File name="Voeux de recensement (csv)" link={buildLink(`/api/admin/fichiers/voeux-recensement.csv`)} />
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}

export default Exports;
