import { FormateurLibelle } from "../../common/components/fields/formateur/Libelle";
import { FormateurUai } from "../../common/components/fields/formateur/Uai";
import { FormateurSiret } from "../../common/components/fields/formateur/Siret";

import { Button, Input, Link, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";

export const FormateursSansVoeux = ({ gestionnaire, formateurs }) => {
  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th>Siret</Th>
          <Th>UAI</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
          return (
            <Tr key={formateur?.uai}>
              <Td>
                <Link variant="popup">Détail&nbsp;</Link>
              </Td>
              <Td>
                <FormateurLibelle formateur={formateur} />
              </Td>
              <Td>
                <FormateurSiret formateur={formateur} />
              </Td>
              <Td>
                <FormateurUai formateur={formateur} />
              </Td>
              <Td>
                <Link variant="popup">Déléguer&nbsp;</Link>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
