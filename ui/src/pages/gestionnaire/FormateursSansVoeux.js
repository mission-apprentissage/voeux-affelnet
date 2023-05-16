import { Box, Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

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
                <Text lineHeight={6}>
                  <FormateurLibelle formateur={formateur} />
                </Text>
              </Td>
              <Td>
                <Box display="flex">
                  <Text lineHeight={6}>
                    <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} callback={callback} />
                  </Text>
                </Box>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} callback={callback} />
                </Text>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
