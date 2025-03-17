import { List, ListItem, Text, Flex } from "@chakra-ui/react";
import {
  ResponsableHistoryItems,
  FormateurHistoryItems,
  DelegueHistoryItems,
  RelationHistoryItems,
} from "../../constants/History";

export const getResponsableHistory = (history) => {
  return { ...history, value: ResponsableHistoryItems.get(history.action)?.component(history.variables) };
};

export const getFormateurHistory = (history) => {
  return { ...history, value: FormateurHistoryItems.get(history.action)?.component(history.variables) };
};

export const getDelegueHistory = (history) => {
  return { ...history, value: DelegueHistoryItems.get(history.action)?.component(history.variables) };
};

export const getRelationHistory = (history) => {
  return { ...history, value: RelationHistoryItems.get(history.action)?.component(history.variables) };
};

export const HistoryList = ({ responsable, formateur, delegue, relation }) => {
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

  return (
    <List spacing={4}>
      {histories.map((history, index) => {
        const date = new Date(history.date);
        return (
          <ListItem key={index}>
            <Flex alignItems={"center"}>
              <Text color="var(--chakra-colors-gray-500)" minW={"168px"} align={"right"}>
                {date.toLocaleDateString()} à {date.toLocaleTimeString()}
              </Text>
              <Text borderLeft="2px solid black" ml={4} pl={4}>
                {history.value}
              </Text>
            </Flex>
          </ListItem>
        );
      })}

      {!histories.length && <>Aucun historique à afficher</>}
    </List>
  );
};
