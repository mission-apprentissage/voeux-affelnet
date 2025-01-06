import { useCallback } from "react";
import { Text, Button, useDisclosure } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../../hooks/responsableHooks";
import { UserStatut } from "../../../constants/UserStatut";
import { isResponsableFormateur } from "../../../utils/getUserType";
import { DelegationModal } from "../modals/DelegationModal";
import { StatutBadge, statuses } from "../../StatutBadge";
import { SuccessFill } from "../../../../theme/components/icons/SuccessFill";
import { WarningFill } from "../../../../theme/components/icons/WarningFill";
import { DownloadType } from "../../../constants/DownloadType";

export const FormateurStatut = ({ relation, callback, showDownloadButton }) => {
  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;
  const delegue = relation.delegue;

  const { isOpen, onOpen, onClose } = useDisclosure();

  const downloadVoeux = useDownloadVoeux({ responsable, formateur });

  const downloadVoeuxAndReload = useCallback(async () => {
    await downloadVoeux();
    await callback?.();
  }, [downloadVoeux, callback]);

  if (!responsable || !formateur) {
    return;
  }

  const isDiffusionAutorisee = !!delegue;

  const voeuxDisponible = relation?.nombre_voeux > 0;

  const voeuxTelechargementsDelegue =
    relation.voeux_telechargements?.filter((telechargement) => telechargement.downloadType === DownloadType.DELEGUE) ??
    [];

  const voeuxTelechargementsResponsable =
    relation.voeux_telechargements?.filter(
      (telechargement) => telechargement.downloadType === DownloadType.RESPONSABLE
    ) ?? [];

  switch (isDiffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsDelegue.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsDelegue.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsDelegue.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsDelegue.length ||
            !voeuxTelechargementsDelegue.find(
              (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut && !voeuxDisponible: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
        }
        case UserStatut.CONFIRME === delegue.statut: {
          return (
            <Text
              as="span"
              title="Une délégation de droit a été activée pour cet organisme, mais le destinataire n'a pas encore créé son compte."
            >
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Délégation activée, compte non créé
            </Text>
          );
        }
        case UserStatut.EN_ATTENTE === delegue.statut: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
        }
        default: {
          return <StatutBadge statut={statuses.INCONNU} />;
        }
      }
    }
    case false: {
      if (!relation.nombre_voeux) {
        return (
          <>
            <Button ml={4} variant="primary" onClick={onOpen}>
              Déléguer
            </Button>

            <DelegationModal relation={relation} callback={callback} isOpen={isOpen} onClose={onClose} />
          </>
        );
      }

      switch (true) {
        case voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
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
          new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case voeuxDisponible &&
          (!voeuxTelechargementsResponsable.length ||
            !voeuxTelechargementsResponsable.find(
              (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
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
            <Text as="span">
              <SuccessFill verticalAlign="text-bottom" /> Pas de vœux disponibles
            </Text>
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
