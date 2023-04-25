import { Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/gestionnaire/fields/FormateurEmail";
import { FormateurStatut } from "../../common/components/gestionnaire/fields/FormateurStatut";

const FormateurVoeuxDisponibles = ({ gestionnaire, formateur, callback }) => {
  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  if (!etablissement) {
    return;
  }

  return (
    <>
      <Text>{etablissement?.nombre_voeux}</Text>
    </>
  );
};

export const FormateursAvecVoeux = ({ gestionnaire, formateurs, callback }) => {
  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th width="450px">Courriel habilité</Th>
          <Th>Candidats</Th>
          <Th>Statut</Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
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
                <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} callback={callback} />
              </Td>
              <Td>
                <FormateurVoeuxDisponibles gestionnaire={gestionnaire} formateur={formateur} />
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
