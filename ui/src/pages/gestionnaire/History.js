import { List, ListItem, UnorderedList, Text } from "@chakra-ui/react";
import { ResponsableHistoryItems, FormateurHistoryItems } from "../../common/constants/History";

const getGestionnaireHistory = (history) => {
  return { ...history, value: ResponsableHistoryItems.get(history.action)?.component(history.variables) };
};

const getFormateurHistory = (history) => {
  return { ...history, value: FormateurHistoryItems.get(history.action)?.component(history.variables) };
};

export const History = ({ gestionnaire, formateur }) => {
  const gestionnaireHistories = gestionnaire.histories?.map((history) => getGestionnaireHistory(history));
  const formateurHistories = formateur?.histories?.map((history) => getFormateurHistory(history));

  const histories = [...gestionnaireHistories, ...(formateurHistories ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <UnorderedList spacing={2}>
      {histories.map((history) => {
        const date = new Date(history.date);
        return (
          <ListItem>
            <Text as="span" color="var(--chakra-colors-gray-500)">
              {date.toLocaleDateString()} à {date.toLocaleTimeString()}
            </Text>{" "}
            | {history.value}
          </ListItem>
        );
      })}

      {!histories.length && <>Aucun historique à afficher</>}
    </UnorderedList>
  );
};
