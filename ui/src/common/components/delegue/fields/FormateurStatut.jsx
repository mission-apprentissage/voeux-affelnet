import { useCallback } from "react";
import { Text, Button } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../../hooks/delegueHooks";
import { StatutBadge, statuses } from "../../StatutBadge";
import { DownloadType } from "../../../constants/DownloadType";

export const FormateurStatut = ({ relation, callback, showDownloadButton }) => {
  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;

  const downloadVoeux = useDownloadVoeux();

  const downloadVoeuxAndReload = useCallback(async () => {
    await downloadVoeux({ responsable, formateur });
    await callback?.();
  }, [downloadVoeux, responsable, formateur, callback]);

  if (!responsable || !formateur) {
    return;
  }

  const voeuxDisponible = relation?.nombre_voeux > 0;

  const voeuxTelechargementsDelegue =
    relation.voeux_telechargements?.filter((telechargement) => telechargement.downloadType === DownloadType.DELEGUE) ??
    [];

  switch (true) {
    case voeuxDisponible &&
      new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
      !!voeuxTelechargementsDelegue.find(
        (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
      ): {
      return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
    }
    case voeuxDisponible &&
      new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
      !!voeuxTelechargementsDelegue.find(
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
      !!voeuxTelechargementsDelegue.find(
        (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
      ): {
      return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
    }
    case voeuxDisponible &&
      new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
      !voeuxTelechargementsDelegue.find(
        (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
      ): {
      return showDownloadButton ? (
        <Button variant="primary" onClick={downloadVoeuxAndReload}>
          Télécharger
        </Button>
      ) : (
        <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />
      );
    }
    case !voeuxDisponible: {
      return <Text>Pas de voeux disponible</Text>;
    }

    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }

  //     case voeuxDisponible &&
  //       new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
  //       !!voeuxTelechargementsResponsable.find(
  //         (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
  //       ): {
  //       return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
  //     }
  //     case voeuxDisponible &&
  //       new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
  //       !!voeuxTelechargementsResponsable.find(
  //         (telechargement) =>
  //           new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
  //           new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
  //       ): {
  //       return showDownloadButton ? (
  //         <Button variant="primary" onClick={downloadVoeuxAndReload}>
  //           Télécharger
  //         </Button>
  //       ) : (
  //         <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />
  //       );
  //     }
  //     case voeuxDisponible &&
  //       new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
  //       !!voeuxTelechargementsResponsable.find(
  //         (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
  //       ): {
  //       return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
  //     }
  //     case voeuxDisponible &&
  //       (!voeuxTelechargementsResponsable.length ||
  //         !voeuxTelechargementsResponsable.find(
  //           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
  //         )): {
  //       return showDownloadButton ? (
  //         <Button variant="primary" onClick={downloadVoeuxAndReload}>
  //           Télécharger
  //         </Button>
  //       ) : (
  //         <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />
  //       );
  //     }
  //     case !voeuxDisponible: {
  //       return (
  //         <Text as="span">
  //           <SuccessFill verticalAlign="text-bottom" /> Pas de vœux disponibles
  //         </Text>
  //       );
  //     }
  //     default: {
  //       return <StatutBadge statut={statuses.INCONNU} />;
  //     }
  //   }
  // }
};
