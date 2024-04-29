import { Box, Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/responsable/fields/FormateurEmail";
import { FormateurStatut } from "../../common/components/responsable/fields/FormateurStatut";

export const FormateursSansVoeux = ({ responsable, callback }) => {
  const relations = responsable?.relations;

  if (!relations) {
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
        {relations.map((relation) => {
          const formateur = relation.formateur ?? relation.etablissements_formateur;

          if (!formateur) {
            return <></>;
          }

          const delegue = relation.delegue;

          return (
            <Tr key={formateur?.uai}>
              <Td>
                <Link variant="primary" href={`/responsable/formateurs/${formateur?.uai}`}>
                  Détail
                </Link>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurLibelle formateur={formateur} />
                </Text>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurEmail
                    responsable={responsable}
                    formateur={formateur}
                    delegue={delegue}
                    callback={callback}
                  />
                </Text>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurStatut relation={relation} callback={callback} />
                </Text>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
