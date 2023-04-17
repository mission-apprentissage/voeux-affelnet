import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { Button, Link, Table, Tbody, Td, Th, Thead, Tr, Text } from "@chakra-ui/react";

import { FormateurEmail } from "../../common/components/gestionnaire/fields/FormateurEmail";
import { useDownloadVoeux } from "../../common/hooks/gestionnaireHooks";
import { UserStatut } from "../../common/constants/UserStatut";

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
  const etablissementFormateur = gestionnaire.etablissements?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const etablissementGestionnaire = formateur.etablissements?.find(
    (etablissement) => gestionnaire.siret === etablissement.siret
  );

  const diffusionAutorisee = etablissementFormateur?.diffusionAutorisee;

  const voeuxDisponible = etablissementFormateur.nombre_voeux > 0;

  const downloadVoeux = useDownloadVoeux({ gestionnaire, formateur });

  const formateurActive = UserStatut.ACTIVE === formateur.statut;

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements.filter(
    (telechargement) => telechargement.siret === gestionnaire.siret
  );

  const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  /** Log toutes les constantes déclarées plus haut */
  if (formateur.uai === "0490983C")
    console.log({
      gestionnaire,
      formateur,
      etablissementFormateur,
      etablissementGestionnaire,
      diffusionAutorisee,
      voeuxDisponible,
      formateurActive,
      voeuxTelechargementsFormateur,
      voeuxTelechargementsGestionnaire,
    });

  // if (!etablissementFormateur ||) {
  //   return;
  // }

  // Compte créé
  // En attente de confirmation d'email
  // Email confirmé, compte non créé
  // Compté créé, liste non téléchargée
  // Liste téléchargée
  // Mise à jour non téléchargée
  // Mise à jour téléchargée
  // Email non distribué

  switch (diffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFormateur.first_date_voeux) !== new Date(etablissementFormateur.last_date_voeux) &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFormateur.last_date_voeux)
          ): {
          return <>Mise à jour téléchargée</>;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFormateur.first_date_voeux) !== new Date(etablissementFormateur.last_date_voeux) &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date) <= new Date(etablissementFormateur.last_date_voeux) &&
              new Date(telechargement.date) > new Date(etablissementFormateur.first_date_voeux)
          ): {
          return <>Mise à jour non téléchargée</>;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFormateur.first_date_voeux) === new Date(etablissementFormateur.last_date_voeux) &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFormateur.last_date_voeux)
          ): {
          return <>Liste téléchargée</>;
        }
        case UserStatut.ACTIVE === formateur.statut && voeuxDisponible && !voeuxTelechargementsFormateur.length: {
          return <>Compte créé, liste non téléchargée</>;
        }
        case UserStatut.ACTIVE === formateur.statut && !voeuxDisponible: {
          return <>Compte créé</>;
        }
        case UserStatut.CONFIRME === formateur.statut: {
          return <>Email confirmé, compte non créé</>;
        }
        case UserStatut.EN_ATTENTE === formateur.statut: {
          return <>En attente de confirmation d'email</>;
        }
        default: {
          return <>Etat du formateur inconnu</>;
        }
      }
    }
    case false: {
      switch (true) {
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          new Date(etablissementFormateur.first_date_voeux) !== new Date(etablissementFormateur.last_date_voeux) &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFormateur.last_date_voeux)
          ): {
          return <>Mise à jour téléchargée</>;
        }
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          new Date(etablissementFormateur.first_date_voeux) !== new Date(etablissementFormateur.last_date_voeux) &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) =>
              new Date(telechargement.date) <= new Date(etablissementFormateur.last_date_voeux) &&
              new Date(telechargement.date) > new Date(etablissementFormateur.first_date_voeux)
          ): {
          return <>Mise à jour non téléchargée</>;
        }
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          new Date(etablissementFormateur.first_date_voeux) === new Date(etablissementFormateur.last_date_voeux) &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFormateur.last_date_voeux)
          ): {
          return <>Liste téléchargée</>;
        }
        case UserStatut.ACTIVE === gestionnaire.statut && voeuxDisponible && !voeuxTelechargementsGestionnaire.length: {
          return <>Compte créé, liste non téléchargée</>;
        }
        case UserStatut.ACTIVE === gestionnaire.statut && !voeuxDisponible: {
          return <>Compte créé</>;
        }
        case UserStatut.CONFIRME === gestionnaire.statut: {
          return <>Email confirmé, compte non créé</>;
        }
        case UserStatut.EN_ATTENTE === gestionnaire.statut: {
          return <>En attente de confirmation d'email</>;
        }
        default: {
          return <>Etat du responsable inconnu</>;
        }
      }
    }
    default: {
      break;
    }
  }

  return (
    <>
      {diffusionAutorisee ? (
        <>{{}[formateur]}</>
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
