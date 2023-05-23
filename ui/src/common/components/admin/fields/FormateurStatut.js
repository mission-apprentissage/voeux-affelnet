import { UserStatut } from "../../../constants/UserStatut";
import { StatutBadge, statuses } from "../../StatutBadge";

export const FormateurStatut = ({ gestionnaire, formateur }) => {
  if (!gestionnaire || !formateur) {
    return;
  }

  const etablissementFromGestionnaire = gestionnaire.etablissements?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const etablissementFromFormateur = formateur.etablissements?.find(
    (etablissement) => gestionnaire.siret === etablissement.siret
  );

  const diffusionAutorisee = etablissementFromGestionnaire?.diffusionAutorisee;

  const voeuxDisponible = diffusionAutorisee
    ? etablissementFromFormateur?.nombre_voeux > 0
    : etablissementFromGestionnaire?.nombre_voeux > 0;

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements?.filter(
    (telechargement) => telechargement.siret === gestionnaire.siret
  );

  const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements?.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  switch (diffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
            new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() >
              new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
            new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <=
                new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() >
                new Date(etablissementFromGestionnaire.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux).getTime() ===
            new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() >
              new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsFormateur.length ||
            !voeuxTelechargementsFormateur.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut && !voeuxDisponible: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
        }
        case UserStatut.CONFIRME === formateur.statut: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_NON_CREE} />;
        }
        case !!formateur.emails.length && UserStatut.EN_ATTENTE === formateur.statut: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
        }
        case !formateur.emails.length && UserStatut.EN_ATTENTE === formateur.statut: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_DIFFUSION} />;
        }
        default: {
          return <StatutBadge statut={statuses.INCONNU} />;
        }
      }
    }
    case false: {
      switch (true) {
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
            new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() >
              new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux).getTime() !==
            new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <=
                new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() >
                new Date(etablissementFromGestionnaire.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          new Date(etablissementFromGestionnaire.first_date_voeux).getTime() ===
            new Date(etablissementFromGestionnaire.last_date_voeux).getTime() &&
          !!voeuxTelechargementsGestionnaire.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() >
              new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsGestionnaire.length ||
            !voeuxTelechargementsGestionnaire.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === gestionnaire.statut && !voeuxDisponible: {
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
    }
    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }
};
