import { List, ListItem } from "@chakra-ui/react";
import { ResponsableHistoryItems, DelegueHistoryItems, RelationHistoryItems } from "../../constants/History";

import { HistoryItem } from "./HistoryItem";
import { isAcademie, isAdmin } from "../../utils/aclUtils";
import useAuth from "../../hooks/useAuth";

export const getResponsableHistory = (history, auth) => {
  const item = ResponsableHistoryItems.get(history.action);

  return {
    ...history,
    value:
      auth && (isAdmin(auth) || isAcademie(auth)) && item?.componentAdmin
        ? item?.componentAdmin(history.variables)
        : item?.component(history.variables),
  };
};

export const getDelegueHistory = (history, auth) => {
  const item = DelegueHistoryItems.get(history.action);

  return {
    ...history,
    value:
      auth && (isAdmin(auth) || isAcademie(auth)) && item?.componentAdmin
        ? item?.componentAdmin(history.variables)
        : item?.component(history.variables),
  };
};

export const getRelationHistory = (history, auth) => {
  const item = RelationHistoryItems.get(history.action);

  return {
    ...history,
    value:
      auth && (isAdmin(auth) || isAcademie(auth)) && item?.componentAdmin
        ? item?.componentAdmin(history.variables)
        : item?.component(history.variables),
  };
};

export const HistoryList = ({ responsable, delegue, relation }) => {
  const [auth] = useAuth();

  const responsableHistories = responsable?.histories?.map((history) => getResponsableHistory(history, auth));
  const delegueHistories = delegue?.histories?.map((history) => getDelegueHistory(history, auth));
  const relationHistories = relation?.histories?.map((history) => getRelationHistory(history, auth));

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
