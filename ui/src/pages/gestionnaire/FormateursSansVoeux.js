import { Box, Link, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/gestionnaire/fields/FormateurEmail";

export const FormateursSansVoeux = ({ gestionnaire, formateurs, callback }) => {
  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th width="450px">Courriel habilité</Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
          return (
            <Tr key={formateur?.uai}>
              <Td>
                <Link variant="action" href={`/gestionnaire/formateurs/${formateur.uai}`}>
                  Détail
                </Link>
              </Td>
              <Td>
                <FormateurLibelle formateur={formateur} />
              </Td>
              <Td>
                <Box display="flex">
                  <FormateurEmail
                    gestionnaire={gestionnaire}
                    formateur={formateur}
                    showDelegationButton={true}
                    callback={callback}
                  />
                </Box>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
