import { Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { FormateurEmail } from "../../common/components/responsable/fields/FormateurEmail";
import { FormateurStatut } from "../../common/components/responsable/fields/FormateurStatut";

const FormateurVoeuxRestants = ({ responsable, formateur }) => {
  const etablissement = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  if (!etablissement) {
    return;
  }

  return (
    <>
      <Text>{etablissement?.nombre_voeux_restant}</Text>
    </>
  );
};

const FormateurVoeuxDisponibles = ({ responsable, formateur }) => {
  const etablissement = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  if (!etablissement) {
    return;
  }

  return (
    <>
      <Text>{etablissement?.nombre_voeux}</Text>
    </>
  );
};

export const FormateursAvecVoeux = ({ responsable, formateurs, callback }) => {
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
          <Th>Candidats</Th>
          <Th width={"80px"}>Restant à télécharger</Th>
          <Th>Statut</Th>
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
                <Text lineHeight={6}>
                  <FormateurEmail responsable={responsable} formateur={formateur} callback={callback} />
                </Text>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurVoeuxDisponibles responsable={responsable} formateur={formateur} />
                </Text>
              </Td>
              <Td>
                <Text lineHeight={6}>
                  <FormateurVoeuxRestants responsable={responsable} formateur={formateur} />
                </Text>
              </Td>

              <Td>
                <Text lineHeight={6}>
                  <FormateurStatut
                    responsable={responsable}
                    formateur={formateur}
                    callback={callback}
                    showDownloadButton
                  />
                </Text>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
