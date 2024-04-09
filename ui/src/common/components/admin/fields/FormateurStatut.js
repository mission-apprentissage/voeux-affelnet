import { UserStatut } from "../../../constants/UserStatut";
import { StatutBadge, statuses } from "../../StatutBadge";

export const FormateurStatut = ({ responsable, formateur }) => {
  if (!responsable || !formateur) {
    return;
  }

  const etablissementFromResponsable = responsable.etablissements_formateur?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const etablissementFromFormateur = formateur.etablissements_responsable?.find(
    (etablissement) => responsable.siret === etablissement.siret
  );

  const diffusionAutorisee = etablissementFromResponsable?.diffusionAutorisee;

  const voeuxDisponible = diffusionAutorisee
    ? etablissementFromFormateur?.nombre_voeux > 0
    : etablissementFromResponsable?.nombre_voeux > 0;

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements_responsable?.filter(
    (telechargement) => telechargement.siret === responsable.siret
  );

  const voeuxTelechargementsResponsable = responsable.voeux_telechargements_formateur?.filter(
    (telechargement) => telechargement.uai === formateur.uai
  );

  switch (diffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <=
                new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() ===
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsFormateur.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsFormateur.length ||
            !voeuxTelechargementsFormateur.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.last_date_voeux).getTime()
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
        case UserStatut.ACTIVE === responsable.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() !==
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <=
                new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable.statut &&
          voeuxDisponible &&
          new Date(etablissementFromResponsable.first_date_voeux).getTime() ===
            new Date(etablissementFromResponsable.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() > new Date(etablissementFromResponsable.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsResponsable.length ||
            !voeuxTelechargementsResponsable.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromResponsable.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable.statut && !voeuxDisponible: {
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
    }
    default: {
      return <StatutBadge statut={statuses.INCONNU} />;
    }
  }
};
