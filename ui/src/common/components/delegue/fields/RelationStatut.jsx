import { SuccessFill, WarningFill } from "../../../../theme/components/icons";
import { StatutBadge } from "../../StatutBadge";

export const useRelationStatutValues = ({ nombre_voeux, nombre_voeux_restant }) => {
  const partialDownload = `${nombre_voeux} candidatures, dont ${nombre_voeux_restant} non téléchargés`;
  const noDownload = `${nombre_voeux} candidatures, non téléchargées`;
  const fullDownload = `${nombre_voeux} candidatures, toutes téléchargées`;
  const noCandidature = `Aucune candidature`;
  const unknown = `État inconnu`;

  const descriptions = new Map([
    [
      partialDownload,
      {
        icon: <WarningFill color="red" />,
        long: partialDownload,
      },
    ],
    [
      noDownload,
      {
        icon: <WarningFill color="red" />,
        long: noDownload,
      },
    ],
    [
      fullDownload,
      {
        icon: <SuccessFill />,
        long: fullDownload,
      },
    ],
    [
      noCandidature,
      {
        icon: <SuccessFill />,
        long: noCandidature,
      },
    ],
    [
      unknown,
      {
        icon: <WarningFill color="red" />,
        long: unknown,
      },
    ],
  ]);

  return { descriptions, partialDownload, noDownload, fullDownload, noCandidature, unknown };
};

export const RelationStatut = ({ relation }) => {
  const { descriptions, partialDownload, noDownload, fullDownload, noCandidature, unknown } =
    useRelationStatutValues(relation);

  const nombreVoeux = relation?.nombre_voeux;
  const nombreVoeuxRestant = relation?.nombre_voeux_restant;

  switch (true) {
    case nombreVoeux && nombreVoeuxRestant && nombreVoeuxRestant !== nombreVoeux:
      return <StatutBadge descriptions={descriptions} statut={partialDownload} />;

    case nombreVoeux && nombreVoeuxRestant === nombreVoeux:
      return <StatutBadge descriptions={descriptions} statut={noDownload} />;

    case nombreVoeux && !nombreVoeuxRestant:
      return <StatutBadge descriptions={descriptions} statut={fullDownload} />;

    case !nombreVoeux:
      return <StatutBadge descriptions={descriptions} statut={noCandidature} />;

    default: {
      return <StatutBadge descriptions={descriptions} statut={unknown} />;
    }
  }
};

// import { useCallback } from "react";
// import { Text, Button } from "@chakra-ui/react";

// import { useDownloadVoeux } from "../../../hooks/delegueHooks";
// // import { StatutBadge, statuses } from "../../StatutBadge";
// import { CONTACT_TYPE } from "../../../constants/ContactType";

// export const RelationStatut = ({ relation, callback, showDownloadButton }) => {
//   const responsable = relation.responsable ?? relation.etablissements_responsable;
//   const formateur = relation.formateur ?? relation.etablissements_formateur;

//   const downloadVoeux = useDownloadVoeux();

//   const downloadVoeuxAndReload = useCallback(async () => {
//     await downloadVoeux({ responsable, formateur });
//     await callback?.();
//   }, [downloadVoeux, responsable, formateur, callback]);

//   if (!responsable || !formateur) {
//     return;
//   }

//   const voeuxDisponible = relation?.nombre_voeux > 0;

//   const voeuxTelechargementsDelegue =
//     relation.voeux_telechargements?.filter(
//       (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
//     ) ?? [];

//   switch (true) {
//     // case voeuxDisponible &&
//     //   new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//     //   !!voeuxTelechargementsDelegue.find(
//     //     (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//     //   ): {
//     //   return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
//     // }
//     // case voeuxDisponible &&
//     //   new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//     //   !!voeuxTelechargementsDelegue.find(
//     //     (telechargement) =>
//     //       new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
//     //       new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
//     //   ): {
//     //   return showDownloadButton ? (
//     //     <Button variant="primary" onClick={downloadVoeuxAndReload}>
//     //       Télécharger
//     //     </Button>
//     //   ) : (
//     //     <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />
//     //   );
//     // }
//     // case voeuxDisponible &&
//     //   new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
//     //   !!voeuxTelechargementsDelegue.find(
//     //     (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//     //   ): {
//     //   return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
//     // }
//     // case voeuxDisponible &&
//     //   new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
//     //   !voeuxTelechargementsDelegue.find(
//     //     (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//     //   ): {
//     //   return showDownloadButton ? (
//     //     <Button variant="primary" onClick={downloadVoeuxAndReload}>
//     //       Télécharger
//     //     </Button>
//     //   ) : (
//     //     <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />
//     //   );
//     // }
//     // case !voeuxDisponible: {
//     //   return <Text>Pas de voeux disponible</Text>;
//     // }

//     default: {
//       return;
//       // return <StatutBadge statut={statuses.INCONNU} />;
//     }
//   }

//   //     case voeuxDisponible &&
//   //       new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//   //       !!voeuxTelechargementsResponsable.find(
//   //         (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //       ): {
//   //       return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
//   //     }
//   //     case voeuxDisponible &&
//   //       new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//   //       !!voeuxTelechargementsResponsable.find(
//   //         (telechargement) =>
//   //           new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
//   //           new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
//   //       ): {
//   //       return showDownloadButton ? (
//   //         <Button variant="primary" onClick={downloadVoeuxAndReload}>
//   //           Télécharger
//   //         </Button>
//   //       ) : (
//   //         <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />
//   //       );
//   //     }
//   //     case voeuxDisponible &&
//   //       new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
//   //       !!voeuxTelechargementsResponsable.find(
//   //         (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //       ): {
//   //       return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
//   //     }
//   //     case voeuxDisponible &&
//   //       (!voeuxTelechargementsResponsable.length ||
//   //         !voeuxTelechargementsResponsable.find(
//   //           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //         )): {
//   //       return showDownloadButton ? (
//   //         <Button variant="primary" onClick={downloadVoeuxAndReload}>
//   //           Télécharger
//   //         </Button>
//   //       ) : (
//   //         <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />
//   //       );
//   //     }
//   //     case !voeuxDisponible: {
//   //       return (
//   //         <Text as="span">
//   //           <SuccessFill  verticalAlign="text-bottom" /> Pas de vœux disponibles
//   //         </Text>
//   //       );
//   //     }
//   //     default: {
//   //       return <StatutBadge statut={statuses.INCONNU} />;
//   //     }
//   //   }
//   // }
// };
