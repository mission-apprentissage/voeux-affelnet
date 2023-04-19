import { useCallback } from "react";
import { Button, useDisclosure } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../../hooks/gestionnaireHooks";
import { UserStatut } from "../../../constants/UserStatut";
import { SuccessFill } from "../../../../theme/components/icons/SuccessFill";
import { WarningFill } from "../../../../theme/components/icons/WarningFill";
import { isResponsableFormateur } from "../../../utils/getUserType";
import { DelegationModal } from "../modals/DelegationModal";

export const FormateurStatut = ({ gestionnaire, formateur, callback }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const etablissementFromGestionnaire = gestionnaire.etablissements?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const etablissementFromFormateur = formateur.etablissements?.find(
    (etablissement) => gestionnaire.siret === etablissement.siret
  );

  const diffusionAutorisee = etablissementFromGestionnaire?.diffusionAutorisee;

  const voeuxDisponible = etablissementFromGestionnaire.nombre_voeux > 0;

  const downloadVoeux = useDownloadVoeux({ gestionnaire, formateur });

  const downloadVoeuxAndReload = useCallback(async () => {
    await downloadVoeux();
    await callback?.();
  }, [downloadVoeux, callback]);

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements.filter(
    (telechargement) => telechargement.siret === gestionnaire.siret
  );

  const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  switch (diffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux) !==
            new Date(etablissementFromGestionnaire.last_date_voeux) &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFromGestionnaire.last_date_voeux)
          ): {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Mise à jour téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux) !==
            new Date(etablissementFromGestionnaire.last_date_voeux) &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date) <= new Date(etablissementFromGestionnaire.last_date_voeux) &&
              new Date(telechargement.date) > new Date(etablissementFromGestionnaire.first_date_voeux)
          ): {
          return (
            <>
              <WarningFill verticalAlign="text-bottom" />
              Mise à jour non téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux) ===
            new Date(etablissementFromGestionnaire.last_date_voeux) &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFromGestionnaire.last_date_voeux)
          ): {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Liste téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsFormateur.length ||
            !voeuxTelechargementsFormateur.find(
              (telechargement) =>
                new Date(telechargement.date) > new Date(etablissementFromGestionnaire.last_date_voeux)
            )): {
          return (
            <>
              <WarningFill verticalAlign="text-bottom" />
              Compte créé, liste non téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === formateur.statut && !voeuxDisponible: {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Compte créé
            </>
          );
        }
        case UserStatut.CONFIRME === formateur.statut: {
          return (
            <>
              <WarningFill verticalAlign="text-bottom" /> Email confirmé, compte non créé
            </>
          );
        }
        case UserStatut.EN_ATTENTE === formateur.statut: {
          return (
            <>
              <WarningFill verticalAlign="text-bottom" /> En attente de confirmation d'email
            </>
          );
        }
        default: {
          return (
            <>
              <WarningFill verticalAlign="text-bottom" /> Etat inconnu
            </>
          );
        }
      }
    }
    case false: {
      if (!gestionnaire.nombre_voeux) {
        return (
          <>
            {!isResponsableFormateur({ gestionnaire, formateur }) && !etablissementFromGestionnaire.diffusionAutorisee && (
              <>
                <Button ml={4} variant="primary" onClick={onOpen}>
                  Déléguer
                </Button>

                <DelegationModal
                  gestionnaire={gestionnaire}
                  formateur={formateur}
                  callback={callback}
                  isOpen={isOpen}
                  onClose={onClose}
                />
              </>
            )}
          </>
        );
      }

      switch (true) {
        case voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux) !==
            new Date(etablissementFromGestionnaire.last_date_voeux) &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFromGestionnaire.last_date_voeux)
          ): {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Mise à jour téléchargée
            </>
          );
        }
        case voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux) !==
            new Date(etablissementFromGestionnaire.last_date_voeux) &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) =>
              new Date(telechargement.date) <= new Date(etablissementFromGestionnaire.last_date_voeux) &&
              new Date(telechargement.date) > new Date(etablissementFromGestionnaire.first_date_voeux)
          ): {
          return (
            <>
              <Button variant="primary" onClick={downloadVoeuxAndReload}>
                Télécharger
              </Button>
            </>
          );
        }
        case voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux) ===
            new Date(etablissementFromGestionnaire.last_date_voeux) &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) => new Date(telechargement.date) > new Date(etablissementFromGestionnaire.last_date_voeux)
          ): {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Liste téléchargée
            </>
          );
        }
        case voeuxDisponible &&
          (!voeuxTelechargementsGestionnaire.length ||
            !voeuxTelechargementsGestionnaire.find(
              (telechargement) =>
                new Date(telechargement.date) > new Date(etablissementFromGestionnaire.last_date_voeux)
            )): {
          return (
            <>
              <Button variant="primary" onClick={downloadVoeuxAndReload}>
                Télécharger
              </Button>
            </>
          );
        }
        case !voeuxDisponible: {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Pas de vœux disponibles
            </>
          );
        }
        default: {
          return (
            <>
              <WarningFill verticalAlign="text-bottom" /> Etat inconnu
            </>
          );
        }
      }
    }
    default: {
      return (
        <>
          <WarningFill verticalAlign="text-bottom" /> Etat inconnu
        </>
      );
    }
  }
};
