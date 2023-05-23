import { UserStatut } from "../../../constants/UserStatut";
import { StatutBadge, statuses } from "../../StatutBadge";

export const GestionnaireStatut = ({ gestionnaire }) => {
  if (!gestionnaire) {
    return;
  }

  switch (true) {
    case UserStatut.ACTIVE === gestionnaire.statut: {
      return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
    }
    case UserStatut.CONFIRME === gestionnaire.statut: {
      return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_NON_CREE} />;
    }

    case !!gestionnaire.emails.length && UserStatut.EN_ATTENTE === gestionnaire.statut: {
      return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
    }
    case !gestionnaire.emails.length && UserStatut.EN_ATTENTE === gestionnaire.statut: {
      return <StatutBadge statut={statuses.EN_ATTENTE_DE_DIFFUSION} />;
    }

    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }
};
