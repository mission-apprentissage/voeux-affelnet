import { UserStatut } from "../../../constants/UserStatut";
import { StatutBadge, statuses } from "../../StatutBadge";

export const EtablissementStatut = ({ etablissement }) => {
  if (!etablissement) {
    return;
  }

  switch (true) {
    case UserStatut.ACTIVE === etablissement.statut: {
      return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
    }
    case UserStatut.CONFIRME === etablissement.statut: {
      return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_NON_CREE} />;
    }

    case !!etablissement.emails.length && UserStatut.EN_ATTENTE === etablissement.statut: {
      return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
    }
    case !etablissement.emails.length && UserStatut.EN_ATTENTE === etablissement.statut: {
      return <StatutBadge statut={statuses.EN_ATTENTE_DE_DIFFUSION} />;
    }

    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }
};
