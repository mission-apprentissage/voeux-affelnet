import { Box, Link, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/gestionnaire/fields/FormateurEmail";
import { FormateurStatut } from "../../common/components/gestionnaire/fields/FormateurStatut";

export const FormateursSansVoeux = ({ gestionnaire, formateurs, callback }) => {
  if (!formateurs) {
    return;
  }

  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th width="450px">Courriel habilité</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
          if (!formateur) {
            return <></>;
          }
          return (
            <Tr key={formateur?.uai}>
              <Td>
                <Link variant="primary" href={`/gestionnaire/formateurs/${formateur.uai}`}>
                  Détail
                </Link>
              </Td>
              <Td>
                <FormateurLibelle formateur={formateur} />
              </Td>
              <Td>
                <Box display="flex">
                  <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} callback={callback} />
                </Box>
              </Td>
              <Td>
                <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} callback={callback} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
