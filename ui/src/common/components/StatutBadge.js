import { Box } from "@chakra-ui/react";
import { SuccessFill } from "../../theme/components/icons/SuccessFill";
import { WarningFill } from "../../theme/components/icons/WarningFill";

export const statuses = {
  EN_ATTENTE_DE_DIFFUSION: "En attente de diffusion de campagne",
  EN_ATTENTE_DE_CONFIRMATION: "En attente de confirmation d'adresse courriel",
  EMAIL_CONFIRME_COMPTE_NON_CREE: "Adresse courriel  confirmé, compte non créé",
  EMAIL_CONFIRME_COMPTE_CREE: "Adresse courriel confirmé, compte créé",
  LISTE_NON_TELECHARGEE: "Compte créé, liste non téléchargée",
  LISTE_TELECHARGEE: "Liste téléchargée",
  MISE_A_JOUR_NON_TELECHARGEE: "Mise à jour non téléchargée",
  MISE_A_JOUR_TELECHARGEE: "Mise à jour téléchargée",
  INCONNU: "État inconnu",
};

export const statusesDescription = new Map([
  [
    statuses.EN_ATTENTE_DE_DIFFUSION,
    {
      icon: <SuccessFill verticalAlign="text-bottom" />,
      description: `Le destinataire n'a pas encore reçu de courriel l'invitant à confirmer son adresse courriel et créer son compte.`,
    },
  ],
  [
    statuses.EN_ATTENTE_DE_CONFIRMATION,
    {
      icon: <WarningFill color="#fcc63a" verticalAlign="text-bottom" />,
      description: `Le destinataire a reçu un courriel l'invitant à confirmer son adresse courriel, mais n'a pas cliqué sur le lien de confirmation d'adresse.`,
    },
  ],
  [
    statuses.EMAIL_CONFIRME_COMPTE_NON_CREE,
    {
      icon: <WarningFill color="#fcc63a" verticalAlign="text-bottom" />,
      description: `Le destinataire a confirmé son adresse courriel mais n'a pas encore créé son mot de passe de connexion au service de téléchargement des listes de vœux.`,
    },
  ],
  [
    statuses.EMAIL_CONFIRME_COMPTE_CREE,
    {
      icon: <SuccessFill verticalAlign="text-bottom" />,
      description: `Le destinataire a créé son compte pour l'accès aux listes de vœux. Aucune liste n'est pour l'instant disponible. Une notification courriel lui sera envoyée lorsqu'une liste sera disponible.`,
    },
  ],
  [
    statuses.LISTE_NON_TELECHARGEE,
    {
      icon: <WarningFill color="#fcc63a" verticalAlign="text-bottom" />,
      description: `Le destinataire a créé son compte pour l'accès aux listes de vœux mais n'a pas encore téléchargé la liste de vœux disponible.`,
    },
  ],
  [
    statuses.LISTE_TELECHARGEE,
    {
      icon: <SuccessFill verticalAlign="text-bottom" />,
      description: `Le destinataire a bien téléchargé la liste de vœux. Si une mise à jour de cette liste est disponible, l'utilisateur en sera notifié par courriel.`,
    },
  ],
  [
    statuses.MISE_A_JOUR_NON_TELECHARGEE,
    {
      icon: <WarningFill color="#fcc63a" verticalAlign="text-bottom" />,
      description: `Le destinataire a téléchargé une première version de la liste de vœux puis a été notifié d'une mise à jour, mais celle-ci n'a pas encore été téléchargée.`,
    },
  ],
  [
    statuses.MISE_A_JOUR_TELECHARGEE,
    {
      icon: <SuccessFill verticalAlign="text-bottom" />,
      description: `Le destinataire a bien téléchargé la liste de vœux ainsi que la mise à jour qui a suivi. Les téléchargements restent possibles en accédant à la fonction "Détail".`,
    },
  ],
  [
    statuses.INCONNU,
    {
      icon: <WarningFill color="#fcc63a" verticalAlign="text-bottom" />,
      description: `État inconnu`,
    },
  ],
]);

export const StatutBadge = ({ statut }) => {
  const statutDescription = statusesDescription.get(statut);

  return (
    <Box title={statutDescription.description} cursor={"help"}>
      {statutDescription.icon} {statut}
    </Box>
  );
};
