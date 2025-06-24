import { SuccessFill, WarningFill } from "../../../../theme/components/icons";
import { StatutBadge } from "../../StatutBadge";

export const useRelationStatutValues = ({ nombre_voeux, nombre_voeux_restant }) => {
  const partialDownload = `${nombre_voeux} candidature${nombre_voeux > 1 ? "s" : ""}, dont ${nombre_voeux_restant} non téléchargée${nombre_voeux_restant > 1 ? "s" : ""}`;
  const noDownload = `${nombre_voeux} candidatures, non téléchargée${nombre_voeux > 1 ? "s" : ""}`;
  const fullDownload = `${nombre_voeux} candidatures, toutes téléchargée${nombre_voeux > 1 ? "s" : ""}`;
  const noCandidature = `Aucune candidature`;
  const unknown = `État inconnu`;

  const descriptions = new Map([
    [
      partialDownload,
      {
        icon: <WarningFill color="red" />,
        long: partialDownload,
      },
    ],
    [
      noDownload,
      {
        icon: <WarningFill color="red" />,
        long: noDownload,
      },
    ],
    [
      fullDownload,
      {
        icon: <SuccessFill />,
        long: fullDownload,
      },
    ],
    [
      noCandidature,
      {
        icon: <SuccessFill />,
        long: noCandidature,
      },
    ],
    [
      unknown,
      {
        icon: <WarningFill color="red" />,
        long: unknown,
      },
    ],
  ]);

  return { descriptions, partialDownload, noDownload, fullDownload, noCandidature, unknown };
};

export const RelationStatut = ({ relation }) => {
  const { descriptions, partialDownload, noDownload, fullDownload, noCandidature, unknown } =
    useRelationStatutValues(relation);

  const nombreVoeux = relation?.nombre_voeux;
  const nombreVoeuxRestant = relation?.nombre_voeux_restant;

  switch (true) {
    case nombreVoeux && nombreVoeuxRestant && nombreVoeuxRestant !== nombreVoeux:
      return <StatutBadge descriptions={descriptions} statut={partialDownload} />;

    case nombreVoeux && nombreVoeuxRestant === nombreVoeux:
      return <StatutBadge descriptions={descriptions} statut={noDownload} />;

    case nombreVoeux && !nombreVoeuxRestant:
      return <StatutBadge descriptions={descriptions} statut={fullDownload} />;

    case !nombreVoeux:
      return <StatutBadge descriptions={descriptions} statut={noCandidature} />;

    default: {
      return <StatutBadge descriptions={descriptions} statut={unknown} />;
    }
  }
};

// import { useCallback } from "react";
// import { Text, Button, useDisclosure } from "@chakra-ui/react";

// import { useDownloadVoeux } from "../../../hooks/responsableHooks";
// import { DelegationModal } from "../modals/DelegationModal";
// import { StatutBadge, statuses } from "../../StatutBadge";
// import { SuccessFill  } from "../../../../theme/components/icons/SuccessFill ";
// import { WarningFill  } from "../../../../theme/components/icons/WarningFill ";
// import { CONTACT_TYPE } from "../../../constants/ContactType";
// import { USER_STATUS } from "../../../constants/UserStatus";

// export const RelationStatut = ({ relation, callback, showDownloadButton }) => {
//   const responsable = relation.responsable ?? relation.etablissements_responsable;
//   const formateur = relation.formateur ?? relation.etablissements_formateur;
//   const delegue = relation.delegue;

//   const { isOpen, onOpen, onClose } = useDisclosure();

//   const {downloadVoeux} = useDownloadVoeux({ responsable, formateur });

//   const downloadVoeuxAndReload = useCallback(async () => {
//     await downloadVoeux();
//     await callback?.();
//   }, [downloadVoeux, callback]);

//   if (!responsable || !formateur) {
//     return;
//   }

//   // const isDiffusionAutorisee = !!delegue;

//   // const voeuxDisponible = relation?.nombre_voeux > 0;

//   // const voeuxTelechargementsDelegue =
//   //   relation.voeux_telechargements?.filter(
//   //     (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.DELEGUE
//   //   ) ?? [];

//   // const voeuxTelechargementsResponsable =
//   //   relation.voeux_telechargements?.filter(
//   //     (telechargement) => telechargement.CONTACT_TYPE === CONTACT_TYPE.RESPONSABLE
//   //   ) ?? [];

//   // switch (isDiffusionAutorisee) {
//   //   case true: {
//   //     switch (true) {
//   //       case USER_STATUS.ACTIVE === delegue.statut &&
//   //         voeuxDisponible &&
//   //         new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//   //         !!voeuxTelechargementsDelegue.find(
//   //           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //         ): {
//   //         return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
//   //       }
//   //       case USER_STATUS.ACTIVE === delegue.statut &&
//   //         voeuxDisponible &&
//   //         new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//   //         !!voeuxTelechargementsDelegue.find(
//   //           (telechargement) =>
//   //             new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
//   //             new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
//   //         ): {
//   //         return <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />;
//   //       }
//   //       case USER_STATUS.ACTIVE === delegue.statut &&
//   //         voeuxDisponible &&
//   //         new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
//   //         !!voeuxTelechargementsDelegue.find(
//   //           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //         ): {
//   //         return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
//   //       }
//   //       case USER_STATUS.ACTIVE === delegue.statut &&
//   //         voeuxDisponible &&
//   //         (!voeuxTelechargementsDelegue.length ||
//   //           !voeuxTelechargementsDelegue.find(
//   //             (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //           )): {
//   //         return <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />;
//   //       }
//   //       case USER_STATUS.ACTIVE === delegue.statut && !voeuxDisponible: {
//   //         return <StatutBadge statut={statuses.EMAIL_CONFIRME_COMPTE_CREE} />;
//   //       }
//   //       case USER_STATUS.CONFIRME === delegue.statut: {
//   //         return (
//   //           <Text
//   //             as="span"
//   //             title="Une délégation de droit a été activée pour cet organisme, mais le destinataire n'a pas encore créé son compte."
//   //           >
//   //             <WarningFill  color="red" verticalAlign="text-bottom" /> Délégation activée, compte non créé
//   //           </Text>
//   //         );
//   //       }
//   //       case USER_STATUS.EN_ATTENTE === delegue.statut: {
//   //         return <StatutBadge statut={statuses.EN_ATTENTE_DE_CONFIRMATION} />;
//   //       }
//   //       default: {
//   //         return <StatutBadge statut={statuses.INCONNU} />;
//   //       }
//   //     }
//   //   }
//   //   case false: {
//   //     if (!relation.nombre_voeux) {
//   //       return (
//   //         <>
//   //           <Button ml={4} variant="primary" onClick={onOpen}>
//   //             Déléguer
//   //           </Button>

//   //           <DelegationModal relation={relation} callback={callback} isOpen={isOpen} onClose={onClose} />
//   //         </>
//   //       );
//   //     }

//   //     switch (true) {
//   //       case voeuxDisponible &&
//   //         new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//   //         !!voeuxTelechargementsResponsable.find(
//   //           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //         ): {
//   //         return <StatutBadge statut={statuses.MISE_A_JOUR_TELECHARGEE} />;
//   //       }
//   //       case voeuxDisponible &&
//   //         new Date(relation.first_date_voeux).getTime() !== new Date(relation.last_date_voeux).getTime() &&
//   //         !!voeuxTelechargementsResponsable.find(
//   //           (telechargement) =>
//   //             new Date(telechargement.date).getTime() <= new Date(relation.last_date_voeux).getTime() &&
//   //             new Date(telechargement.date).getTime() > new Date(relation.first_date_voeux).getTime()
//   //         ): {
//   //         return showDownloadButton ? (
//   //           <Button variant="primary" onClick={downloadVoeuxAndReload}>
//   //             Télécharger
//   //           </Button>
//   //         ) : (
//   //           <StatutBadge statut={statuses.MISE_A_JOUR_NON_TELECHARGEE} />
//   //         );
//   //       }
//   //       case voeuxDisponible &&
//   //         new Date(relation.first_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime() &&
//   //         !!voeuxTelechargementsResponsable.find(
//   //           (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //         ): {
//   //         return <StatutBadge statut={statuses.LISTE_TELECHARGEE} />;
//   //       }
//   //       case voeuxDisponible &&
//   //         (!voeuxTelechargementsResponsable.length ||
//   //           !voeuxTelechargementsResponsable.find(
//   //             (telechargement) => new Date(telechargement.date).getTime() > new Date(relation.last_date_voeux).getTime()
//   //           )): {
//   //         return showDownloadButton ? (
//   //           <Button variant="primary" onClick={downloadVoeuxAndReload}>
//   //             Télécharger
//   //           </Button>
//   //         ) : (
//   //           <StatutBadge statut={statuses.LISTE_NON_TELECHARGEE} />
//   //         );
//   //       }
//   //       case !voeuxDisponible: {
//   //         return (
//   //           <Text as="span">
//   //             <SuccessFill  verticalAlign="text-bottom" /> Pas de vœux disponibles
//   //           </Text>
//   //         );
//   //       }
//   //       default: {
//   //         return <StatutBadge statut={statuses.INCONNU} />;
//   //       }
//   //     }
//   //   }
//   //   default: {
//   //     return <StatutBadge statut={statuses.INCONNU} />;
//   //   }
//   // }

//   return;
// };
