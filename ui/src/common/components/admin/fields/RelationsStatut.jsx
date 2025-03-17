// import { StatutBadge } from "../../StatutBadge";
import { RelationStatut /*, useRelationStatutValues*/ } from "./RelationStatut";

export const RelationsStatut = ({ relations }) => {
  const nombreVoeux = relations?.reduce((prev, next) => prev + next.nombre_voeux, 0) ?? 0;
  const nombreVoeuxRestant = relations?.reduce((prev, next) => prev + next.nombre_voeux_restant, 0) ?? 0;

  return <RelationStatut relation={{ nombre_voeux: nombreVoeux, nombre_voeux_restant: nombreVoeuxRestant }} />;
  // const { descriptions, partialDownload, noDownload, fullDownload, noCandidature, unknown } = useRelationStatutValues({
  //   nombre_voeux: nombreVoeux,
  //   nombre_voeux_restant: nombreVoeuxRestant,
  // });

  // switch (true) {
  //   case nombreVoeux && nombreVoeuxRestant !== nombreVoeux:
  //     return <StatutBadge descriptions={descriptions} statut={partialDownload} />;

  //   case nombreVoeux && nombreVoeuxRestant === nombreVoeux:
  //     return <StatutBadge descriptions={descriptions} statut={noDownload} />;

  //   case nombreVoeux && !nombreVoeuxRestant:
  //     return <StatutBadge descriptions={descriptions} statut={fullDownload} />;

  //   case !nombreVoeux:
  //     return <StatutBadge descriptions={descriptions} statut={noCandidature} />;

  //   default: {
  //     return <StatutBadge descriptions={descriptions} statut={unknown} />;
  //   }
  // }
};
