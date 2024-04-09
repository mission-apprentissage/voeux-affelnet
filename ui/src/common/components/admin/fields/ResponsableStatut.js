import { UserStatut } from "../../../constants/UserStatut";
import { StatutBadge, statuses } from "../../StatutBadge";

export const ResponsableStatut = ({ responsable }) => {
  if (!responsable) {
    return;
  }

  switch (true) {
    case UserStatut.ACTIVE === responsable.statut: {
      return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
    }
    case UserStatut.CONFIRME === responsable.statut: {
      return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_NON_CREE} />;
    }

    case !!responsable.emails.length && UserStatut.EN_ATTENTE === responsable.statut: {
      return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
    }
    case !responsable.emails.length && UserStatut.EN_ATTENTE === responsable.statut: {
      return <StatutBadge statut={statuses.EN_ATTENTE_DE_DIFFUSION} />;
    }

    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }
};
