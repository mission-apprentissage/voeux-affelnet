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
        icon: <WarningFill color="#fcc63a" verticalAlign="middle" />,
        long: partialDownload,
      },
    ],
    [
      noDownload,
      {
        icon: <WarningFill color="#fcc63a" verticalAlign="middle" />,
        long: noDownload,
      },
    ],
    [
      fullDownload,
      {
        icon: <SuccessFill verticalAlign="middle" />,
        long: fullDownload,
      },
    ],
    [
      noCandidature,
      {
        icon: <SuccessFill verticalAlign="middle" />,
        long: noCandidature,
      },
    ],
    [
      unknown,
      {
        icon: <WarningFill color="#fcc63a" verticalAlign="middle" />,
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
    case nombreVoeux && nombreVoeuxRestant !== nombreVoeux:
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

// export const RelationStatut = ({ relation }) => {
//   const voeuxDisponible = relation?.nombre_voeux > 0;

//   switch (true) {
//     // TODO : [Candidatures chargées, non diffusées]
//     // RELATION_STATUS.CANDIDATURES_TELECHARGEES
//     case voeuxDisponible &&
//       new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//       !!relation.voeux_telechargement.find(
//         (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//       ): {
//       return <>{relation?.nombre_voeux} candidatures toutes téléchargées</>;
//     }
//     // RELATION_STATUS.CANDIDATURES_NON_TELECHARGEES
//     case voeuxDisponible &&
//       new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//       !!relation.voeux_telechargement.find(
//         (telechargement) =>
//           new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
//           new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
//       ): {
//       return <>{relation?.nombre_voeux_restant} candidatures non téléchargées</>;
//     }
//     // RELATION_STATUS.CANDIDATURES_TELECHARGEES
//     case voeuxDisponible &&
//       new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
//       !!relation.voeux_telechargement.find(
//         (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//       ): {
//       return <>{relation?.nombre_voeux} candidatures toutes téléchargées</>;
//     }
//     // RELATION_STATUS.CANDIDATURES_NON_TELECHARGEES
//     case voeuxDisponible &&
//       (!relation.voeux_telechargement.length ||
//         !relation.voeux_telechargement.find(
//           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//         )): {
//       return <>{relation?.nombre_voeux_restant} candidatures non téléchargées</>;
//     }

//     // RELATION_STATUS.PAS_DE_CANDIDATURE
//     case !voeuxDisponible:
//       return <>Aucune candidature</>;

//     // RELATION_STATUS.INCONNU
//     default: {
//       return <>État inconnu</>;
//     }
//   }
// };
