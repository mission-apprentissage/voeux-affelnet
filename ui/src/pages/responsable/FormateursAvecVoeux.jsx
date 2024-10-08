import { Fragment } from "react";
import { Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/responsable/fields/FormateurEmail";
import { FormateurStatut } from "../../common/components/responsable/fields/FormateurStatut";

export const FormateursAvecVoeux = ({ responsable, callback }) => {
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
          <Th>Candidats</Th>
          <Th width={"70px"}>Restant à télécharger</Th>
          <Th>Statut</Th>
        </Tr>
      </Thead>
      <Tbody>
        {relations.map((relation, index) => {
          const formateur = relation.formateur ?? relation.etablissement_formateur;
          const delegue = relation.delegue;

          return (
            <Tr key={index}>
              <Td>
                {relation.formateur && (
                  <Link variant="primary" href={`/responsable/formateurs/${formateur?.uai}`}>
                    Détail
                  </Link>
                )}
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
                <Text lineHeight={6}>{relation.nombre_voeux.toLocaleString()}</Text>
              </Td>
              <Td>
                <Text lineHeight={6}>{relation.nombre_voeux_restant.toLocaleString()}</Text>
              </Td>

              <Td>
                <Text lineHeight={6}>
                  <FormateurStatut relation={relation} callback={callback} showDownloadButton />
                </Text>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
