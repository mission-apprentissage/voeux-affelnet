export const FormateurActions = {
  ACCOUNT_ACTIVATED: "FORMATEUR_ACCOUNT_ACTIVATED",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT: "FORMATEUR_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT: "FORMATEUR_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT: "FORMATEUR_ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT",

  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT: "FORMATEUR_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT: "FORMATEUR_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT: "FORMATEUR_ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT",
  ACCOUNT_CONFIRMED: "FORMATEUR_ACCOUNT_CONFIRMED",

  ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT: "FORMATEUR_ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT",
  ACCOUNT_EMAIL_UPDATED_BY_ADMIN: "FORMATEUR_ACCOUNT_EMAIL_UPDATED_BY_ADMIN",

  DELEGATION_CANCELLED_BY_ADMIN: "DELEGATION_CANCELLED_BY_ADMIN",
  DELEGATION_CANCELLED_BY_RESPONSABLE: "DELEGATION_CANCELLED_BY_RESPONSABLE",
  DELEGATION_CREATED_BY_ADMIN: "DELEGATION_CREATED_BY_ADMIN",
  DELEGATION_CREATED_BY_RESPONSABLE: "DELEGATION_CREATED_BY_RESPONSABLE",
  DELEGATION_UPDATED_BY_ADMIN: "DELEGATION_UPDATED_BY_ADMIN",
  DELEGATION_UPDATED_BY_RESPONSABLE: "DELEGATION_UPDATED_BY_RESPONSABLE",

  LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
  LIST_AVAILABLE: "LIST_AVAILABLE",
  LIST_DOWNLOADED_BY_FORMATEUR: "LIST_DOWNLOADED_BY_FORMATEUR",
  LIST_DOWNLOADED_BY_RESPONSABLE: "LIST_DOWNLOADED_BY_RESPONSABLE",

  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
  UPDATED_LIST_AVAILABLE: "UPDATED_LIST_AVAILABLE",
  UPDATED_LIST_DOWNLOADED_BY_FORMATEUR: "UPDATED_LIST_DOWNLOADED_BY_FORMATEUR",
  UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE: "UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE",
};

export const FormateurHistoryItems = new Map([
  [
    FormateurActions.ACCOUNT_ACTIVATED,
    {
      component: ({ email } = { email: "Email inconnu" }) =>
        `${email} a créé son mot de passe de connexion au service.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
    {
      // component: ({ email }) =>
      //   `Action automatique – ${email} a reçu un rappel de demande de création de mot de passe.`,
      component: ({ email }) => `Action automatique – ${email} a reçu une demande de création de mot de passe.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) => `Action automatique – ${email} a reçu une demande de création de mot de passe.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        // `${admin} a généré l'envoi d'un rappel à ${email} pour création de son mot de passe.`,
        `${admin} a généré l'envoi d'un courriel à ${email} pour création de son mot de passe.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        // `Action automatique – Un rappel de demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
        `Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        // `${admin} a généré l'envoi d'un rappel à ${email} pour confirmation de son adresse courriel.`,
        `${admin} a généré l'envoi d'un courriel à ${email} pour confirmation de son adresse courriel.`,
    },
  ],
  [
    FormateurActions.ACCOUNT_CONFIRMED,
    {
      component: ({ email }) =>
        `${email} a confirmé son adresse courriel. La personne est invitée à cliquer sur un lien pour créer son mot de passe de connexion.`,
    },
  ],
  [FormateurActions.ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT, { component: () => `` }],
  [FormateurActions.ACCOUNT_EMAIL_UPDATED_BY_ADMIN, { component: () => `` }],
  [
    FormateurActions.DELEGATION_CANCELLED_BY_ADMIN,
    {
      component: ({ admin, email }) =>
        `${admin} a annulé la délégation de droits qui avait été accordée à ${email}. Le responsable a récupéré le rôle exclusif d'accès aux listes de vœux pour cet organisme.`,
    },
  ],
  [
    FormateurActions.DELEGATION_CANCELLED_BY_RESPONSABLE,
    {
      component: ({ responsable, email }) =>
        `${responsable} a annulé la délégation de droits qui avait été accordée à ${email}, et a récupéré le rôle exclusif d'accès aux listes de vœux pour cet organisme.`,
    },
  ],
  [
    FormateurActions.DELEGATION_CREATED_BY_ADMIN,
    {
      component: ({ admin, email }) =>
        `${admin} a délégué les droits de réception des listes pour cet organisme à ${email}.`,
    },
  ],
  [
    FormateurActions.DELEGATION_CREATED_BY_RESPONSABLE,
    {
      component: ({ responsable, email }) =>
        `${responsable} a délégué les droits de réception des listes pour cet organisme à ${email}.`,
    },
  ],
  [
    FormateurActions.DELEGATION_UPDATED_BY_ADMIN,
    {
      component: ({ admin, email }) =>
        `${admin} a délégué les droits de réception des listes pour cet organisme à ${email}.`,
    },
  ],
  [
    FormateurActions.DELEGATION_UPDATED_BY_RESPONSABLE,
    {
      component: ({ responsable, email }) =>
        `${responsable} a modifié la délégation de droits pour cet organisme. Nouvelle adresse : ${email}. La nouvelle personne a été notifiée par courriel pour définir son mot de passe.`,
    },
  ],
  [
    FormateurActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        // `Action automatique – Une notification courriel a été renvoyée à ${email} signifiant la disponibilité d'une liste de candidats.`,
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats.`,
    },
  ],
  [
    FormateurActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats.`,
    },
  ],
  [
    FormateurActions.LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        // ` ${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité d'une liste de candidats.`,
        ` ${admin} a généré l'envoi  d'une notification courriel à ${email} signifiant la disponibilité d'une liste de candidats.`,
    },
  ],
  [
    FormateurActions.LIST_AVAILABLE,
    {
      component: ({ responsable, nombre_voeux }) =>
        `Une liste de ${nombre_voeux} candidat${
          nombre_voeux > 1 ? "s" : ""
        } aux formations proposées par l'établissement formateur pour le compte de l'organisme responsable ${
          responsable?.siret
        } est disponible.`,
    },
  ],
  [
    FormateurActions.LIST_DOWNLOADED_BY_FORMATEUR,
    {
      component: ({ responsable }) =>
        `La liste des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable ${responsable?.siret} a été téléchargée par l'organisme formateur.`,
    },
  ],
  [
    FormateurActions.LIST_DOWNLOADED_BY_RESPONSABLE,
    {
      component: ({ responsable, formateur }) =>
        `La liste des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable ${responsable?.siret} a été téléchargée par l'organisme responsable.`,
    },
  ],
  [
    FormateurActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        // `Action automatique – Une notification courriel a été renvoyée à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
  [
    FormateurActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT,
    {
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
  [
    FormateurActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT,
    {
      component: ({ email, admin }) =>
        // ` ${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité d'une liste de candidats mise à jour.`,
        ` ${admin} a généré l'envoi  d'une notification courriel à ${email} signifiant la disponibilité d'une liste de candidats mise à jour.`,
    },
  ],
  [
    FormateurActions.UPDATED_LIST_AVAILABLE,
    {
      component: ({ responsable, nombre_voeux }) =>
        `Une liste mise à jour de ${nombre_voeux} candidat${
          nombre_voeux > 1 ? "s" : ""
        } aux formations proposées par l'établissement formateur pour le compte de l'organisme responsable ${
          responsable?.siret
        } est disponible.`,
    },
  ],
  [FormateurActions.UPDATED_LIST_DOWNLOADED_BY_FORMATEUR, { component: () => `` }],
  [FormateurActions.UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE, { component: () => `` }],
  [
    FormateurActions.UPDATED_LIST_AVAILABLE,
    {
      component: ({ responsable, nombre_voeux }) =>
        `Une liste mise à jour  de ${nombre_voeux} candidat${
          nombre_voeux > 1 ? "s" : ""
        } aux formations proposées par l'établissement formateur pour le compte de l'organisme responsable ${
          responsable?.siret
        } est disponible.`,
    },
  ],
  [
    FormateurActions.UPDATED_LIST_DOWNLOADED_BY_FORMATEUR,
    {
      component: ({ responsable }) =>
        `La liste mise à jour des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable ${responsable?.siret} a été téléchargée par l'organisme formateur.`,
    },
  ],
  [
    FormateurActions.UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE,
    {
      component: ({ responsable, formateur }) =>
        `La liste mise à jour des candidats aux formations proposées par l'établissement pour le compte de l'organisme responsable ${responsable?.siret} a été téléchargée par l'organisme responsable.`,
    },
  ],
]);

export const ResponsableActions = {
  ACCOUNT_ACTIVATED: "RESPONSABLE_ACCOUNT_ACTIVATED",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT: "RESPONSABLE_ACCOUNT_ACTIVATION_EMAIL_MANUAL_RESENT",

  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT",
  ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_SENT",
  ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT: "RESPONSABLE_ACCOUNT_CONFIRMATION_EMAIL_MANUAL_RESENT",
  ACCOUNT_CONFIRMED: "RESPONSABLE_ACCOUNT_CONFIRMED",

  // ACCOUNT_CREATED: "RESPONSABLE_ACCOUNT_CREATED",

  ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT: "RESPONSABLE_ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT",
  ACCOUNT_EMAIL_UPDATED_BY_ADMIN: "RESPONSABLE_ACCOUNT_EMAIL_UPDATED_BY_ADMIN",

  LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "LIST_AVAILABLE_EMAIL_MANUAL_RESENT",

  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT",
  UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT: "UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT",
  UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT: "UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_RESENT",
};

export const ResponsableHistoryItems = new Map([
  [
    ResponsableActions.ACCOUNT_ACTIVATED,
    { component: ({ email }) => `${email} a créé son mot de passe de connexion au service.` },
  ],
  [
    ResponsableActions.ACCOUNT_ACTIVATION_EMAIL_AUTOMATIC_RESENT,
    {
      // component: ({ email }) =>
      //   `Action automatique – ${email} a reçu un rappel de demande de création de mot de passe.`,
      component: ({ email }) => `Action automatique – ${email} a reçu une demande de création de mot de passe.`,
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
    ResponsableActions.ACCOUNT_CONFIRMATION_EMAIL_AUTOMATIC_RESENT,
    {
      // component: ({ email }) =>
      //   `Action automatique – Un rappel de demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
      component: ({ email }) =>
        `Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à ${email}.`,
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
        // `${admin} a généré l'envoi d'un rappel à ${email} pour confirmation de son adresse courriel.`,
        `${admin} a généré l'envoi d'un courriel à ${email} pour confirmation de son adresse courriel.`,
    },
  ],
  [
    ResponsableActions.ACCOUNT_CONFIRMED,
    {
      component: ({ email }) =>
        `${email} a confirmé son adresse courriel. La personne est invitée à cliquer sur un lien pour créer son mot de passe de connexion.`,
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
      // component: ({ email }) =>
      //   `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats.`,
      component: ({ email }) =>
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats.`,
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
        // ` ${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité de listes de candidats.`,
        ` ${admin} a généré l'envoi d'une notification courriel à ${email} signifiant la disponibilité de listes de candidats.`,
    },
  ],
  [
    ResponsableActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_RESENT,
    {
      component: ({ email }) =>
        // `Action automatique – Une notification courriel a été renvoyée à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
        `Action automatique – Une notification courriel a été envoyée à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
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
        // ` ${admin} a généré l'envoi d'un rappel à ${email} d'une notification courriel signifiant la disponibilité de listes de candidats mise à jour.`,
        ` ${admin} a généré l'envoi d'une notification courriel à ${email} signifiant la disponibilité de listes de candidats mise à jour.`,
    },
  ],
]);

// "UPDATED_LIST_DOWNLOADED_BY_FORMATEUR";"Formateur";"[mail délégué] a téléchargé la liste de vœux mise à jour pour cet organisme"
// "UPDATED_LIST_DOWNLOADED_BY_RESPONSABLE";"Formateur";"[mail admin responsable] a téléchargé la liste de vœux mise à jour pour cet organisme."
// "UPDATED_LIST_MANUAL_EMAIL_SENT";"Formateur";"[Email super admin ou Email responsable] a généré l'envoi d'un rappel à [mail délégué] pour téléchargement de la mise à jour de la liste de vœux"
// "UPDATED_LIST_AUTOMATIC_EMAIL_SENT";"Formateur";"Action automatique – Un courriel de rappel a été envoyé à [mail délégué si existant, sinon mail admin responsable] pour téléchargement de la mise à jour de la liste de vœux"
// "UPDATED_LIST_AVAILABLE";"Formateur";"Une mise à jour de la liste de vœux est disponible, en attente de téléchargement par [mail délégué si existant, sinon mail admin responsable]"
// "LIST_DOWNLOADED_BY_FORMATEUR";"Formateur";"[mail délégué] a téléchargé la liste de vœux pour cet organisme"
// "LIST_DOWNLOADED_BY_RESPONSABLE";"Formateur";"[mail admin responsable] a téléchargé la liste de vœux pour cet organisme."
// "LIST_AVAILABLE_MANUAL_EMAIL_SENT";"Formateur";"[Email super admin ou Email responsable] a généré l'envoi d'un rappel à [mail délégué] pour téléchargement de la liste de vœux"
// "LIST_AVAILABLE_AUTOMATIC_EMAIL_SENT";"Formateur";"Action automatique – Un courriel de rappel a été envoyé à [mail délégué si existant, sinon mail admin responsable] pour téléchargement de la liste de vœux"
// "LIST_AVAILABLE";"Formateur";"Une liste de vœux est disponible, en attente de téléchargement par [mail délégué si existant, sinon mail admin responsable]"
// "DELEGATION_CANCELLED_BY_ADMIN";"Formateur";"[Email super-admin] a annulé la délégation de droits qui avait été accordée à [mail délégué]. Le responsable a récupéré le rôle exclusif d'accès aux listes de vœux pour cet organisme."
// "DELEGATION_CANCELLED_BY_RESPONSABLE";"Formateur";"[Email responsable] a annulé la délégation de droits qui avait été accordée à [mail délégué], et a récupéré le rôle exclusif d'accès aux listes de vœux pour cet organisme"
// "DELEGATION_UPDATED_BY_ADMIN";"Formateur";"[Email super-admin] a délégué les droits de réception des listes pour cet organisme à [email]"
// "DELEGATION_UPDATED_BY_RESPONSABLE";"Formateur";"[Email responsable] a modifié la délégation de droits pour cet organisme. Nouvelle adresse : [email] (ancienne adesse : [email]). La nouvelle personne a été notifiée par courriel pour confirmer son adresse."
// "DELEGATION_CREATED_BY_ADMIN";"Formateur";"[Email super-admin] a délégué les droits de réception des listes pour cet organisme à [email]"
// "DELEGATION_CREATED_BY_RESPONSABLE";"Formateur";"[Email responsable] a délégué les droits de réception des listes pour cet organisme à [email]"
//
// "FORMATEUR_ACCOUNT_ACTIVATED";"Formateur";"[email] a créé son mot de passe de connexion."
// "FORMATEUR_ACCOUNT_ACTIVATION_MANUAL_EMAIL_RESENT";"Formateur";"[Email super admin ou Email responsable] a généré l'envoi d'un rappel à [mail délégué] pour création de son mot de passe de connexion"
// "FORMATEUR_ACCOUNT_ACTIVATION_AUTOMATIC_EMAIL_RESENT";"Formateur";"Action automatique – Un courriel de rappel a été envoyé à [email] pour création de son mot de passe de connexion."
// "FORMATEUR_ACCOUNT_CONFIRMED";"Formateur";"[email] a confirmé son adresse courriel. La personne a reçu un lien pour créer son mot de passe de connexion."
// "FORMATEUR_ACCOUNT_CONFIRMATION_MANUAL_EMAIL_RESENT";"Formateur";"[Email super admin ou Email responsable] a généré l'envoi d'un rappel à [mail délégué] pour confirmation de son adresse courriel"
// "FORMATEUR_ACCOUNT_CONFIRMATION_AUTOMATIC_EMAIL_RESENT";"Formateur";"Action automatique – Un courriel de rappel a été envoyé à [email] pour confirmation d'adresse et création de compte."
// "FORMATEUR_ACCOUNT_CONFIRMATION_AUTOMATIC_EMAIL_SENT";"Formateur";"Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à l'organisme [email]"
//
// "FORMATEUR_ACCOUNT_EMAIL_UPDATED_BY_ADMIN";"Formateur";"[Email super admin] a modifié l'email de l'organisme. Nouvelle adresse [email] (adresse précédente : [email])"
// "FORMATEUR_ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT";"Formateur";"Modification d'email // lors de la création de compte // via page profil"
//
// "RESPONSABLE_ACCOUNT_ACTIVATED";"Gestionnaire, Formateur";"[email resp] a créé son mot de passe de connexion au service."
// "RESPONSABLE_ACCOUNT_ACTIVATION_MANUAL_EMAIL_RESENT";"Gestionnaire, Formateur";"[Email super admin] a généré l'envoi d'un rappel à [mail admin responsable] pour création de son mot de passe."
// "RESPONSABLE_ACCOUNT_ACTIVATION_AUTOMATIC_EMAIL_RESENT";"Gestionnaire, Formateur";"Action automatique – [email resp] a reçu un rappel de demande de création de mot de passe."
// "RESPONSABLE_ACCOUNT_CONFIRMED";"Gestionnaire, Formateur";"[email] a confirmé son adresse courriel. La personne est invitée à cliquer sur un lien pour créer son mot de passe de connexion."
// "RESPONSABLE_ACCOUNT_CONFIRMATION_MANUAL_EMAIL_RESENT";"Gestionnaire, Formateur";"[Email super admin] a généré l'envoi d'un rappel à [mail admin responsable] pour confirmation de son adresse courriel."
// "RESPONSABLE_ACCOUNT_CONFIRMATION_AUTOMATIC_EMAIL_RESENT";"Gestionnaire, Formateur";"Action automatique – Un rappel de demande de confirmation d'adresse courriel a été envoyée à [email]"
// "RESPONSABLE_ACCOUNT_CONFIRMATION_AUTOMATIC_EMAIL_SENT";"Gestionnaire, Formateur";"Action automatique – Une demande de confirmation d'adresse courriel a été envoyée à l'organisme [responsable/vide] [email]"
//
// "RESPONSABLE_ACCOUNT_EMAIL_UPDATED_BY_ADMIN";"Gestionnaire, Formateur";"[Email super admin] a modifié l'email du directeur de l'organisme. Nouvelle adresse [email] (adresse précédente : [email])"
// "RESPONSABLE_ACCOUNT_EMAIL_UPDATED_BY_ACCOUNT";"Gestionnaire, Formateur";"Modification d'email // lors de la création de compte // via page profil"
//
// "RESPONSABLE_ACCOUNT_EMAIL_CREATED";"Gestionnaire, Formateur";"Enregistrement de l'email en base de données ([email]). Origine de l'email : [diffusion des listes 2022 | Adresse associée au Siret [Siret] sur les offres 2023 enregistrées auprès du Carif-Oref] | Edition manuelle par [mail admin]"
