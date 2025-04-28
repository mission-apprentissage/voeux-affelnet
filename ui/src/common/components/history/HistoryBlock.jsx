import { Text, Link, Box } from "@chakra-ui/react";
import { getDelegueHistory, getRelationHistory, getResponsableHistory } from "./HistoryList";
import { HistoryItem } from "./HistoryItem";
import { useState } from "react";

export const HistoryBlock = ({ relation, responsable, delegue }) => {
  const [showMore, setShowMore] = useState(false);
  const limit = 1;

  const responsableHistories = responsable?.histories?.map((history) => getResponsableHistory(history));
  const delegueHistories = delegue?.histories?.map((history) => getDelegueHistory(history));
  const relationHistories = relation?.histories?.map((history) => getRelationHistory(history));

  const histories = [...(responsableHistories ?? []), ...(delegueHistories ?? []), ...(relationHistories ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      {!!histories.length && (
        <>
          <Text fontWeight={"bold"}>Historique d'activité</Text>

          {(showMore ? histories : histories.slice(0, limit)).map((history, index) => (
            <Box mt="2" key={index}>
              <HistoryItem mt="2" history={history} />
            </Box>
          ))}

          {histories?.length > limit && (
            <Text mt={2}>
              <Link variant="action" onClick={() => setShowMore(!showMore)}>
                {showMore ? <>Voir moins</> : <>Voir l'historique complet</>}
              </Link>
            </Text>
          )}
        </>
      )}
    </>
  );
};
