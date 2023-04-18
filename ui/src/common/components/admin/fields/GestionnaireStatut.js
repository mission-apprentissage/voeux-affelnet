import { Tag, Text } from "@chakra-ui/react";
import { UserStatut } from "../../../constants/UserStatut";
import { SuccessFill } from "../../../../theme/components/icons/SuccessFill";
import { WarningFill } from "../../../../theme/components/icons/WarningFill";

export const GestionnaireStatut = ({ gestionnaire }) => {
  switch (true) {
    case UserStatut.ACTIVE === gestionnaire.statut: {
      return (
        <>
          <SuccessFill verticalAlign="text-bottom" /> Compte créé
        </>
      );
    }
    case UserStatut.CONFIRME === gestionnaire.statut: {
      return (
        <>
          <WarningFill verticalAlign="text-bottom" /> Email confirmé, compte non créé
        </>
      );
    }
    case UserStatut.EN_ATTENTE === gestionnaire.statut: {
      return (
        <>
          <WarningFill verticalAlign="text-bottom" /> En attente de confirmation d'email
        </>
      );
    }
    default: {
      return (
        <>
          <WarningFill verticalAlign="text-bottom" /> Etat inconnu
        </>
      );
    }
  }
};
