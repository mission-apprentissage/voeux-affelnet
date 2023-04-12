import { FormateurLibelle } from "../../common/components/formateur/fields/Libelle";
import { Button, Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurEmail } from "../../common/components/formateur/fields/Email";
import { useDownloadVoeux } from "../../common/hooks/gestionnaireHooks";

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

const FormateurStatut = ({ gestionnaire, formateur, callback }) => {
  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  const voeuxDisponible = etablissement.nombre_voeux > 0;

  const downloadVoeux = useDownloadVoeux({ formateur });

  if (!etablissement) {
    return;
  }

  return (
    <>
      {diffusionAutorisee ? (
        <></>
      ) : (
        <>
          {voeuxDisponible ? (
            <Button variant="primary" onClick={downloadVoeux}>
              Télécharger
            </Button>
          ) : (
            <>Pas de vœux disponibles</>
          )}
        </>
      )}
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
          <Th>Vœux 2023</Th>
          <Th>Statut d'avancement</Th>
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
                <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} callback={callback} />
              </Td>
              <Td>
                <FormateurVoeuxDisponibles gestionnaire={gestionnaire} formateur={formateur} />
              </Td>
              <Td>
                <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
