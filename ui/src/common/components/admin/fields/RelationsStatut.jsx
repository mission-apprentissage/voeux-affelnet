// import { StatutBadge } from "../../StatutBadge";
import { RelationStatut /*, useRelationStatutValues*/ } from "./RelationStatut";

export const RelationsStatut = ({ relations }) => {
  const nombreVoeux = relations?.reduce((prev, next) => prev + next.nombre_voeux, 0) ?? 0;
  const nombreVoeuxRestant = relations?.reduce((prev, next) => prev + next.nombre_voeux_restant, 0) ?? 0;

  return <RelationStatut relation={{ nombre_voeux: nombreVoeux, nombre_voeux_restant: nombreVoeuxRestant }} />;
};
