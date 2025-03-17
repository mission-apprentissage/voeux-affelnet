import { Box, Flex, Text, useDisclosure, Link } from "@chakra-ui/react";
import { getDelegueHistory, getFormateurHistory, getRelationHistory, getResponsableHistory } from "./HistoryList";
import { HistoryModal } from "./HistoryModal";

export const HistoryBlock = ({ relation, responsable, formateur, delegue }) => {
  const {
    isOpen: isOpenRelationHistoryModal,
    onOpen: onOpenRelationHistoryModal,
    onClose: onCloseRelationHistoryModal,
  } = useDisclosure();

  const responsableHistories = responsable?.histories?.map((history) => getResponsableHistory(history));
  const formateurHistories = formateur?.histories?.map((history) => getFormateurHistory(history));
  const delegueHistories = delegue?.histories?.map((history) => getDelegueHistory(history));
  const relationHistories = relation?.histories?.map((history) => getRelationHistory(history));

  const histories = [
    ...(responsableHistories ?? []),
    ...(formateurHistories ?? []),
    ...(delegueHistories ?? []),
    ...(relationHistories ?? []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastHistory = histories[0];
  const date = new Date(lastHistory?.date);

  return (
    <>
      {!!histories[0] && (
        <>
          <Text fontWeight={"bold"}>Historique d'activité</Text>

          <Box mt={2}>
            <Flex alignItems={"center"}>
              <Text color="var(--chakra-colors-gray-500)" minW={"168px"} align={"right"}>
                {date.toLocaleDateString()} à {date.toLocaleTimeString()}
              </Text>
              <Text borderLeft="2px solid black" ml={4} pl={4}>
                {lastHistory.value}
              </Text>
            </Flex>
          </Box>
          {!!histories[1] && (
            <Text mt={2}>
              <Link variant="action" onClick={onOpenRelationHistoryModal}>
                Voir l'historique complet
              </Link>
              <HistoryModal
                relation={relation}
                responsable={responsable}
                formateur={formateur}
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
