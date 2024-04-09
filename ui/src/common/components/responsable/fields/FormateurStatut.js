import { useCallback } from "react";
import { Box, Button, useDisclosure } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../../hooks/responsableHooks";
import { UserStatut } from "../../../constants/UserStatut";
import { isResponsableFormateur } from "../../../utils/getUserType";
import { DelegationModal } from "../modals/DelegationModal";
import { StatutBadge, statuses } from "../../StatutBadge";
import { SuccessFill } from "../../../../theme/components/icons/SuccessFill";
import { WarningFill } from "../../../../theme/components/icons/WarningFill";

export const FormateurStatut = ({ responsable, formateur, callback, showDownloadButton }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const downloadVoeux = useDownloadVoeux({ responsable, formateur });

  const downloadVoeuxAndReload = useCallback(async () => {
    await downloadVoeux();
    await callback?.();
  }, [downloadVoeux, callback]);

  if (!responsable || !formateur) {
    return;
  }

  const etablissementFromResponsable = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const etablissementFromFormateur = formateur.etablissements_responsable?.find(
    (etablissement) => responsable.siret === etablissement.siret
  );

  const diffusionAutorisee = etablissementFromResponsable?.diffusionAutorisee;

  const voeuxDisponible = etablissementFromResponsable.nombre_voeux > 0;

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements_responsable.filter(
    (telechargement) => telechargement.siret === responsable.siret
  );

  const voeuxTelechargementsResponsable = responsable.voeux_telechargements_formateur.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  switch (diffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <=
                new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() ===
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsFormateur.length ||
            !voeuxTelechargementsFormateur.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut && !voeuxDisponible: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
        }
        case UserStatut.CONFIRME === formateur.statut: {
          return (
            <Box title="Une délégation de droit a été activée pour cet organisme, mais le destinataire n'a pas encore créé son compte.">
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Délégation activée, compte non créé
            </Box>
          );
        }
        case UserStatut.EN_ATTENTE === formateur.statut: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
        }
        default: {
          return <StatutBadge statut={statuses.INCONNU} />;
        }
      }
    }
    case false: {
      if (!responsable.nombre_voeux) {
        return (
          <>
            {!isResponsableFormateur({ responsable, formateur }) && !etablissementFromResponsable.diffusionAutorisee && (
              <>
                <Button ml={4} variant="primary" onClick={onOpen}>
                  Déléguer
                </Button>

                <DelegationModal
                  responsable={responsable}
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
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <=
                new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.first_date_voeux).getTime()
          ): {
          return showDownloadButton ? (
            <Button variant="primary" onClick={downloadVoeuxAndReload}>
              Télécharger
            </Button>
          ) : (
            <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />
          );
        }
        case voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() ===
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case voeuxDisponible &&
          (!voeuxTelechargementsResponsable.length ||
            !voeuxTelechargementsResponsable.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.last_date_voeux).getTime()
            )): {
          return showDownloadButton ? (
            <Button variant="primary" onClick={downloadVoeuxAndReload}>
              Télécharger
            </Button>
          ) : (
            <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />
          );
        }
        case !voeuxDisponible: {
          return (
            <Box>
              <SuccessFill verticalAlign="text-bottom" /> Pas de vœux disponibles
            </Box>
          );
        }
        default: {
          return <StatutBadge statut={statuses.INCONNU} />;
        }
      }
    }
    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }
};
