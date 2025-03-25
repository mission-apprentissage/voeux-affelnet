import { Box, Text, useDisclosure, Link } from "@chakra-ui/react";
import { getDelegueHistory, /* getFormateurHistory,*/ getRelationHistory, getResponsableHistory } from "./HistoryList";
import { HistoryItem } from "./HistoryItem";
import { HistoryModal } from "./HistoryModal";

export const HistoryBlock = ({ relation, responsable, delegue }) => {
  const {
    isOpen: isOpenRelationHistoryModal,
    onOpen: onOpenRelationHistoryModal,
    onClose: onCloseRelationHistoryModal,
  } = useDisclosure();

  const responsableHistories = responsable?.histories?.map((history) => getResponsableHistory(history));
  const delegueHistories = delegue?.histories?.map((history) => getDelegueHistory(history));
  const relationHistories = relation?.histories?.map((history) => getRelationHistory(history));

  const histories = [...(responsableHistories ?? []), ...(delegueHistories ?? []), ...(relationHistories ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastHistory = histories[0];

  return (
    <>
      {!!histories[0] && (
        <>
          <Text fontWeight={"bold"}>Historique d'activité</Text>

          <Box mt={2}>
            <HistoryItem history={lastHistory} />
          </Box>
          {!!histories[1] && (
            <Text mt={2}>
              <Link variant="action" onClick={onOpenRelationHistoryModal}>
                Voir l'historique complet
              </Link>
              <HistoryModal
                relation={relation}
                responsable={responsable}
                delegue={delegue}
                isOpen={isOpenRelationHistoryModal}
                onClose={onCloseRelationHistoryModal}
              />
            </Text>
          )}
        </>
      )}
    </>
  );
};
