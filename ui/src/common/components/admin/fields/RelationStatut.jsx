import { SuccessFill, WarningFill } from "../../../../theme/components/icons";
import { StatutBadge } from "../../StatutBadge";

export const useRelationStatutValues = ({ nombre_voeux, nombre_voeux_restant }) => {
  const partialDownload = `${nombre_voeux} candidatures, dont ${nombre_voeux_restant} non téléchargées`;
  const noDownload = `${nombre_voeux} candidatures, non téléchargées`;
  const fullDownload = `${nombre_voeux} candidatures, toutes téléchargées`;
  const noCandidature = `Aucune candidature`;
  const unknown = `État inconnu`;

  const descriptions = new Map([
    [
      partialDownload,
      {
        icon: <WarningFill color="#fcc63a" />,
        long: partialDownload,
      },
    ],
    [
      noDownload,
      {
        icon: <WarningFill color="#fcc63a" />,
        long: noDownload,
      },
    ],
    [
      fullDownload,
      {
        icon: <SuccessFill fontSize="18px" />,
        long: fullDownload,
      },
    ],
    [
      noCandidature,
      {
        icon: <SuccessFill fontSize="18px" />,
        long: noCandidature,
      },
    ],
    [
      unknown,
      {
        icon: <WarningFill color="#fcc63a" />,
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
