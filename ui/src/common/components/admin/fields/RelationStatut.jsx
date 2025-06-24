import { SuccessFill, WarningFill } from "../../../../theme/components/icons";
import { StatutBadge } from "../../StatutBadge";

export const useRelationStatutValues = ({ nombre_voeux, nombre_voeux_restant }) => {
  const partialDownload = `${nombre_voeux} candidature${nombre_voeux > 1 ? "s" : ""}, dont ${nombre_voeux_restant} non téléchargée${nombre_voeux_restant > 1 ? "s" : ""}`;
  const noDownload = `${nombre_voeux} candidatures, non téléchargée${nombre_voeux > 1 ? "s" : ""}`;
  const fullDownload = `${nombre_voeux} candidatures, toutes téléchargée${nombre_voeux > 1 ? "s" : ""}`;
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
