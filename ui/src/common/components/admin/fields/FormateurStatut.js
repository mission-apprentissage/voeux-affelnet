import { UserStatut } from "../../../constants/UserStatut";
import { SuccessFill } from "../../../../theme/components/icons/SuccessFill";
import { WarningFill } from "../../../../theme/components/icons/WarningFill";

export const FormateurStatut = ({ gestionnaire, formateur }) => {
  const etablissementFromGestionnaire = gestionnaire.etablissements?.find(
    (etablissement) => formateur.uai === etablissement.uai
  );

  const etablissementFromFormateur = formateur.etablissements?.find(
    (etablissement) => gestionnaire.siret === etablissement.siret
  );

  const diffusionAutorisee = etablissementFromGestionnaire?.diffusionAutorisee;

  const voeuxDisponible = diffusionAutorisee
    ? etablissementFromFormateur.nombre_voeux > 0
    : etablissementFromGestionnaire.nombre_voeux > 0;

  const voeuxTelechargementsFormateur = formateur.voeux_telechargements.filter(
    (telechargement) => telechargement.siret === gestionnaire.siret
  );

  const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements.filter(
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
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Mise à jour téléchargée
            </>
          );
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
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" />
              Mise à jour non téléchargée
            </>
          );
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
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Liste téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === formateur.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsFormateur.length ||
            !voeuxTelechargementsFormateur.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
            )): {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" />
              Compte créé, liste non téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === formateur.statut && !voeuxDisponible: {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Compte créé
            </>
          );
        }
        case UserStatut.CONFIRME === formateur.statut: {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Email confirmé, compte non créé
            </>
          );
        }
        case UserStatut.EN_ATTENTE === formateur.statut: {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> En attente de confirmation d'email
            </>
          );
        }
        default: {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Etat inconnu
            </>
          );
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
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Mise à jour téléchargée
            </>
          );
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
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Mise à jour non téléchargée
            </>
          );
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
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Liste téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === gestionnaire.statut &&
          voeuxDisponible &&
          (!voeuxTelechargementsGestionnaire.length ||
            !voeuxTelechargementsGestionnaire.find(
              (telechargement) =>
                new Date(telechargement.date).getTime() >
                new Date(etablissementFromGestionnaire.last_date_voeux).getTime()
            )): {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Compte créé, liste non téléchargée
            </>
          );
        }
        case UserStatut.ACTIVE === gestionnaire.statut && !voeuxDisponible: {
          return (
            <>
              <SuccessFill verticalAlign="text-bottom" /> Compte créé
            </>
          );
        }
        case UserStatut.CONFIRME === gestionnaire.statut: {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Email confirmé, compte non créé
            </>
          );
        }
        case UserStatut.EN_ATTENTE === gestionnaire.statut: {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> En attente de confirmation d'email
            </>
          );
        }

        default: {
          return (
            <>
              <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Etat inconnu
            </>
          );
        }
      }
    }
    default: {
      return (
        <>
          <WarningFill color="#fcc63a" verticalAlign="text-bottom" /> Etat inconnu
        </>
      );
    }
  }
};
