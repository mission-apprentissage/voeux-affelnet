import { List, ListItem } from "@chakra-ui/react";
import { ResponsableHistoryItems, DelegueHistoryItems, RelationHistoryItems } from "../../constants/History";

import { HistoryItem } from "./HistoryItem";

export const getResponsableHistory = (history) => {
  console.log({ ...history, value: ResponsableHistoryItems.get(history.action)?.component(history.variables) });
  return { ...history, value: ResponsableHistoryItems.get(history.action)?.component(history.variables) };
};

export const getDelegueHistory = (history) => {
  return { ...history, value: DelegueHistoryItems.get(history.action)?.component(history.variables) };
};

export const getRelationHistory = (history) => {
  return { ...history, value: RelationHistoryItems.get(history.action)?.component(history.variables) };
};

export const HistoryList = ({ responsable, delegue, relation }) => {
  const responsableHistories = responsable?.histories?.map((history) => getResponsableHistory(history));

  const delegueHistories = delegue?.histories?.map((history) => getDelegueHistory(history));
  const relationHistories = relation?.histories?.map((history) => getRelationHistory(history));

  const histories = [...(responsableHistories ?? []), ...(delegueHistories ?? []), ...(relationHistories ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <List spacing={4}>
      {histories.map((history, index) => {
        return (
          <ListItem key={index}>
            <HistoryItem history={history} />
          </ListItem>
        );
      })}

      {!histories.length && <>Aucun historique à afficher</>}
    </List>
  );
};
