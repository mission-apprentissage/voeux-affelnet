import { UserStatut } from "../../../constants/UserStatut";
import { UserType } from "../../../constants/UserType";
import { StatutBadge, statuses } from "../../StatutBadge";

export const FormateurStatut = ({ relation }) => {
  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;
  const delegue = relation.delegue;

  if (!responsable || !formateur) {
    return;
  }

  const isDiffusionAutorisee = !!delegue;

  const voeuxDisponible = relation?.nombre_voeux > 0;

  const voeuxTelechargementsDelegue =
    relation.voeux_telechargements?.filter((telechargement) => telechargement.userType === UserType.DELEGUE) ?? [];

  const voeuxTelechargementsResponsable =
    relation.voeux_telechargements?.filter((telechargement) => telechargement.userType === UserType.RESPONSABLE) ?? [];

  switch (isDiffusionAutorisee) {
    case true: {
      switch (true) {
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsDelegue.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsDelegue.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsDelegue.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsDelegue.length ||
            !voeuxTelechargementsDelegue.find(
              (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === delegue.statut && !voeuxDisponible: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
        }
        case UserStatut.CONFIRME === delegue.statut: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_NON_CREE} />;
        }
        case !!delegue.emails?.length && UserStatut.EN_ATTENTE === delegue.statut: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
        }
        case !delegue.emails?.length && UserStatut.EN_ATTENTE === delegue.statut: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_DIFFUSION} />;
        }
        default: {
          return <StatutBadge statut={statuses.INCONNU} />;
        }
      }
    }
    case false: {
      switch (true) {
        case UserStatut.ACTIVE === responsable?.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable?.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) =>
              new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
              new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable?.statut &&
          voeuxDisponible &&
          new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
          !!voeuxTelechargementsResponsable.find(
            (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
          ): {
          return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable?.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsResponsable.length ||
            !voeuxTelechargementsResponsable.find(
              (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
            )): {
          return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
        }
        case UserStatut.ACTIVE === responsable?.statut && !voeuxDisponible: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
        }
        case UserStatut.CONFIRME === responsable?.statut: {
          return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_NON_CREE} />;
        }
        case UserStatut.EN_ATTENTE === responsable?.statut && !!responsable?.emails.length: {
          return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
        }
        case UserStatut.EN_ATTENTE === responsable?.statut && !responsable?.emails.length: {
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
