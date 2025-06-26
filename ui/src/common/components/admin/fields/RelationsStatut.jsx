// import { StatutBadge } from "../../StatutBadge";
import { RelationStatut /*, useRelationStatutValues*/ } from "./RelationStatut";

export const RelationsStatut = ({ etablissement }) => {
  const nombreVoeux =
    etablissement.relations
      ?.filter((relation) => relation.etablissement_responsable.siret === etablissement.siret)
      ?.reduce((prev, next) => prev + next.nombre_voeux, 0) ?? 0;
  const nombreVoeuxRestant =
    etablissement.relations
      ?.filter((relation) => relation.etablissement_responsable.siret === etablissement.siret)
      ?.reduce((prev, next) => prev + next.nombre_voeux_restant, 0) ?? 0;

  return <RelationStatut relation={{ nombre_voeux: nombreVoeux, nombre_voeux_restant: nombreVoeuxRestant }} />;
};
