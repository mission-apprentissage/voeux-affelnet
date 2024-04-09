import { Box, Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/responsable/fields/FormateurEmail";
import { FormateurStatut } from "../../common/components/responsable/fields/FormateurStatut";

export const FormateursSansVoeux = ({ responsable, formateurs, callback }) => {
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
                <Link variant="primary" href={`/responsable/formateurs/${formateur.uai}`}>
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
                    <FormateurEmail responsable={responsable} formateur={formateur} callback={callback} />
                  </Text>
                </Box>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurStatut responsable={responsable} formateur={formateur} callback={callback} />
                </Text>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
