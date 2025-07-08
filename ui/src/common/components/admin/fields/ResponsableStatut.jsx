import { SuccessFill, WarningFill } from "../../../../theme/components/icons";
import { CONTACT_STATUS } from "../../../constants/ContactStatus";
import { USER_STATUS } from "../../../constants/UserStatus";
import { StatutBadge } from "../../StatutBadge";

export const descriptions = new Map([
  [
    CONTACT_STATUS.EN_ATTENTE_DE_DIFFUSION,
    {
      icon: <SuccessFill mr="2" />,
      long: `Le destinataire n'a pas encore reçu de courriel l'invitant à confirmer son adresse courriel et créer son compte.`,
      short: "Responsable en attente de diffusion de campagne",
    },
  ],
  [
    CONTACT_STATUS.EN_ATTENTE_DE_CONFIRMATION,
    {
      icon: <WarningFill color="red" mr="2" />,
      long: `Le destinataire a reçu un courriel l'invitant à confirmer son adresse courriel, mais n'a pas cliqué sur le lien de confirmation d'adresse.`,
      short: "Adresse courriel du responsable en attente de confirmation",
    },
  ],
  [
    CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_NON_CREE,
    {
      icon: <WarningFill color="red" mr="2" />,
      long: `Le destinataire a confirmé son adresse courriel mais n'a pas encore créé son mot de passe de connexion au service de téléchargement des listes de candidats.`,
      short: "Le responsable a confirmé son adresse mais n’a pas créé son mot de passe",
    },
  ],
  [
    CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_CREE,
    {
      icon: <SuccessFill mr="2" />,
      long: `Le destinataire a créé son compte pour l'accès aux listes de candidats. Aucune liste n'est pour l'instant disponible. Une notification courriel lui sera envoyée lorsqu'une liste sera disponible.`,
      short: "Le responsable a créé son compte",
    },
  ],
  [
    CONTACT_STATUS.EMAIL_MANQUANT,
    {
      icon: <WarningFill color="red" mr="2" />,
      long: `Nous n'avons pas l'adresse courriel du destinataire et ne pourrons pas le contacter.`,
      short: "Adresse courriel du responsable manquante",
    },
  ],
  [
    CONTACT_STATUS.INCONNU,
    {
      icon: <WarningFill color="red" mr="2" />,
      long: `État inconnu`,
    },
  ],
]);

export const ResponsableStatut = ({ user, short = false }) => {
  if (!user) {
    return;
  }

  switch (true) {
    case !user.email: {
      return <StatutBadge descriptions={descriptions} statut={CONTACT_STATUS.EMAIL_MANQUANT} short={short} />;
    }

    case USER_STATUS.ACTIVE === user.statut: {
      return (
        <StatutBadge descriptions={descriptions} statut={CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_CREE} short={short} />
      );
    }

    case USER_STATUS.CONFIRME === user.statut: {
      return (
        <StatutBadge descriptions={descriptions} statut={CONTACT_STATUS.EMAIL_CONFIRME_COMPTE_NON_CREE} short={short} />
      );
    }

    case USER_STATUS.EN_ATTENTE === user.statut && !!user.emails?.length: {
      return (
        <StatutBadge descriptions={descriptions} statut={CONTACT_STATUS.EN_ATTENTE_DE_CONFIRMATION} short={short} />
      );
    }

    case USER_STATUS.EN_ATTENTE === user.statut && !user.emails?.length: {
      return <StatutBadge descriptions={descriptions} statut={CONTACT_STATUS.EN_ATTENTE_DE_DIFFUSION} short={short} />;
    }

    default: {
      return <StatutBadge descriptions={descriptions} statut={CONTACT_STATUS.INCONNU} short={short} />;
    }
  }
};
