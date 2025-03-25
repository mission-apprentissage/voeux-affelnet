export const RelationActions = {
  DELEGATION_CANCELLED_BY_ADMIN: "DELEGATION_CANCELLED_BY_ADMIN",
  DELEGATION_CANCELLED_BY_RESPONSABLE: "DELEGATION_CANCELLED_BY_RESPONSABLE",
  DELEGATION_CREATED_BY_ADMIN: "DELEGATION_CREATED_BY_ADMIN",
  DELEGATION_CREATED_BY_RESPONSABLE: "DELEGATION_CREATED_BY_RESPONSABLE",
  DELEGATION_UPDATED_BY_ADMIN: "DELEGATION_UPDATED_BY_ADMIN",
  DELEGATION_UPDATED_BY_RESPONSABLE: "DELEGATION_UPDATED_BY_RESPONSABLE",

  LIST_AVAILABLE: "LIST_AVAILABLE",
  LIST_DOWNLOADED_BY_DELEGUE: "LIST_DOWNLOADED_BY_DELEGUE",
  LIST_DOWNLOADED_BY_RESPONSABLE: "LIST_DOWNLOADED_BY_RESPONSABLE",

  UPDATED_LIST_AVAILABLE: "UPDATED_LIST_AVAILABLE",
  UPDATED_LIST_DOWNLOADED_BY_DELEGUE: "UPDATED_LIST_DOWNLOADED_BY_DELEGUE",
  UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE: "UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE",
};

export const RelationHistoryItems = new Map([
  [
    RelationActions.DELEGATION_CANCELLED_BY_ADMIN,
    {
      component: ({ admin, email }) =>
        `${admin} a annulé la délégation de droits qui avait été accordée à ${email}. Le responsable a récupéré le rôle exclusif d'accès aux listes de vœux pour cet organisme.`,
    },
  ],
  [
    RelationActions.DELEGATION_CANCELLED_BY_RESPONSABLE,
    {
      component: ({ responsable, email }) =>
        `${responsable} a annulé la délégation de droits qui avait été accordée à ${email}, et a récupéré le rôle exclusif d'accès aux listes de vœux pour cet organisme.`,
    },
  ],
  [
    RelationActions.DELEGATION_CREATED_BY_ADMIN,
    {
      component: ({ admin, email }) =>
        `${admin} a délégué les droits de réception des listes pour cet organisme à ${email}.`,
    },
  ],
  [
    RelationActions.DELEGATION_CREATED_BY_RESPONSABLE,
    {
      component: ({ responsable, email }) =>
        `${responsable} a délégué les droits de réception des listes pour cet organisme à ${email}.`,
    },
  ],
  [
    RelationActions.DELEGATION_UPDATED_BY_ADMIN,
    {
      component: ({ admin, email }) =>
        `${admin} a délégué les droits de réception des listes pour cet organisme à ${email}.`,
    },
  ],
  [
    RelationActions.DELEGATION_UPDATED_BY_RESPONSABLE,
    {
      component: ({ responsable, email }) =>
        `${responsable} a modifié la délégation de droits pour cet organisme. Nouvelle adresse : ${email}. La nouvelle personne a été notifiée par courriel pour définir son mot de passe.`,
    },
  ],

  [
    RelationActions.LIST_AVAILABLE,
    {
      component: ({ nombre_voeux }) =>
        `Une liste de ${nombre_voeux.toLocaleString()} candidat${
          nombre_voeux > 1 ? "s" : ""
        } aux formations proposées par l'établissement formateur pour le compte de l'organisme responsable  est disponible.`,
    },
  ],
  [
    RelationActions.LIST_DOWNLOADED_BY_DELEGUE,
    {
      component: ({ delegue }) =>
        `La liste des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable a été téléchargée par le délégué (${delegue.email}).`,
    },
  ],
  [
    RelationActions.LIST_DOWNLOADED_BY_RESPONSABLE,
    {
      component: ({ responsable }) =>
        `La liste des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable a été téléchargée par l'organisme responsable (${responsable.email}).`,
    },
  ],

  [
    RelationActions.UPDATED_LIST_AVAILABLE,
    {
      component: ({ nombre_voeux }) =>
        `Une liste mise à jour  de ${nombre_voeux.toLocaleString()} candidat${
          nombre_voeux > 1 ? "s" : ""
        } aux formations proposées par l'établissement formateur pour le compte de l'organisme responsable est disponible.`,
    },
  ],
  [
    RelationActions.UPDATED_LIST_DOWNLOADED_BY_DELEGUE,
    {
      component: ({ delegue }) =>
        `La liste mise à jour des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable a été téléchargée par le délégué (${delegue.email}).`,
    },
  ],
  [
    RelationActions.UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE,
    {
      component: ({ responsable }) =>
        `La liste mise à jour des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable a été téléchargée par l'organisme responsable (${responsable.email}).`,
    },
  ],
]);

export const DelegueActions = {
  ACCOUNT_ACTIVATED: "DELEGUE_ACCOUNT_ACTIVATED",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT: "DELEGUE_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT: "DELEGUE_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT: "DELEGUE_ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT",
  ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT: "DELEGUE_ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT",

  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT: "DELEGUE_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT: "DELEGUE_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT: "DELEGUE_ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT",
  ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT: "DELEGUE_ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT",
  ACCOUNT_CONFIRMED: "DELEGUE_ACCOUNT_CONFIRMED",

  ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT: "DELEGUE_ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT",
  ACCOUNT_EMAIL_UPDATED_BY_ADMIN: "DELEGUE_ACCOUNT_EMAIL_UPDATED_BY_ADMIN",

  LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
  LIST_AVAILABLE_EMAIL_MANUAL_SENT: "LIST_AVAILABLE_EMAIL_MANUAL_SENT",

  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
  UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT: "UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT",
};

export const DelegueHistoryItems = new Map([
  [
    DelegueActions.ACCOUNT_ACTIVATED,
    {
      component: ({ email } = { email: "Email inconnu" }) =>
        `${email} a créé son mot de passe de connexion au service.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – ${email} a reçu un rappel de demande de création de mot de passe.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) => `Action automatique – ${email} a reçu une demande de création de mot de passe.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un rappel à ${email} pour création de son mot de passe.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un courriel à ${email} pour création de son mot de passe.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – Un rappel de demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un rappel à ${email} pour confirmation de son adresse courriel.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un courriel à ${email} pour confirmation de son adresse courriel.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_CONFIRMED,
    {
      component: ({ email }) =>
        `${email} a confirmé son adresse courriel. La personne est invitée à créer son mot de passe de connexion.`,
    },
  ],
  [
    DelegueActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT,
    {
      component: ({ old_email, new_email }) =>
        `La personne déléguée a mis à jour son adresse courriel (ancien courriel: ${old_email} / nouveau courriel: ${new_email})`,
    },
  ],
  [DelegueActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN, { component: () => `` }],

  [
    DelegueActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été renvoyée à ${email} signifiant la disponibilité d'une liste de candidats.`,
    },
  ],
  [
    DelegueActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats.`,
    },
  ],
  [
    DelegueActions.LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        ` ${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité d'une liste de candidats.`,
    },
  ],
  [
    DelegueActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        ` ${admin} a généré l'envoi d'une notification courriel à ${email} signifiant la disponibilité d'une liste de candidats.`,
    },
  ],

  [
    DelegueActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
  [
    DelegueActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
  [
    DelegueActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        ` ${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
  [
    DelegueActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        ` ${admin} a généré l'envoi d'une notification courriel à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
]);

export const ResponsableActions = {
  ACCOUNT_ACTIVATED: "RESPONSABLE_ACCOUNT_ACTIVATED",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT",
  ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT",

  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT",
  ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT",
  ACCOUNT_CONFIRMED: "RESPONSABLE_ACCOUNT_CONFIRMED",

  // ACCOUNT_CREATED: "RESPONSABLE_ACCOUNT_CREATED",

  ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT: "RESPONSABLE_ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT",
  ACCOUNT_EMAIL_UPDATED_BY_ADMIN: "RESPONSABLE_ACCOUNT_EMAIL_UPDATED_BY_ADMIN",

  LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
  LIST_AVAILABLE_EMAIL_MANUAL_SENT: "LIST_AVAILABLE_EMAIL_MANUAL_SENT",

  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
  UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT: "UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT",
};

export const ResponsableHistoryItems = new Map([
  [
    ResponsableActions.ACCOUNT_ACTIVATED,
    { component: ({ email }) => `${email} a créé son mot de passe de connexion au service.` },
  ],
  [
    ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – ${email} a reçu un rappel de demande de création de mot de passe.`,
      // component: ({ email }) => `Action automatique – ${email} a reçu une demande de création de mot de passe.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) => `Action automatique – ${email} a reçu une demande de création de mot de passe.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un rappel à ${email} pour création de son mot de passe.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un courriel à ${email} pour création de son mot de passe.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – Un rappel de demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un rappel à ${email} pour confirmation de son adresse courriel.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un courriel à ${email} pour confirmation de son adresse courriel.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_CONFIRMED,
    {
      component: ({ email }) =>
        `${email} a confirmé son adresse courriel. La personne est invitée à créer son mot de passe de connexion.`,
    },
  ],
  // [ResponsableActions.ACCOUNT_CREATED, { component: ({}) => `` }],
  [
    ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT,
    {
      component: ({ new_email, old_email }) =>
        `Le responsable a modifié son adresse courriel. Nouvelle adresse ${new_email} (adresse précédente : ${old_email})`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN,
    {
      component: ({ new_email, old_email, admin }) =>
        `${admin} a modifié le courriel du directeur de l'organisme. Nouvelle adresse ${new_email} (adresse précédente : ${old_email}).`,
    },
  ],
  [
    ResponsableActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats.`,
      // component: ({ email }) =>
      // `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats.`,
    },
  ],
  [
    ResponsableActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats.`,
    },
  ],
  [
    ResponsableActions.LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité de listes de candidats.`,
    },
  ],
  [
    ResponsableActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'une notification courriel à ${email} signifiant la disponibilité de listes de candidats.`,
    },
  ],
  [
    ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été renvoyée à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
      // `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
    },
  ],
  [
    ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
    },
  ],
  [
    ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité de listes de candidats mise à jour.`,
    },
  ],
  [
    ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT,
    {
      component: ({ email, admin }) =>
        `${admin} a généré l'envoi d'une notification courriel à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
    },
  ],
]);
