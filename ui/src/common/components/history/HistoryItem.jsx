import { Flex, Icon, Text, Tooltip } from "@chakra-ui/react";
import useAuth from "../../hooks/useAuth";
import { isAcademie, isAdmin } from "../../utils/aclUtils";

export const HistoryItem = ({ history }) => {
  const [auth] = useAuth();

  const date = new Date(history.date);

  return (
    <Flex alignItems={"center"}>
      <Text color="gray.500" minW={"174px"} align={"right"}>
        {date.toLocaleDateString()} à {date.toLocaleTimeString()}
      </Text>
      <Text borderLeft="2px solid black" ml={4} pl={4}>
        {history.value}{" "}
        {isAdmin(auth) && (
          <Tooltip label={history.action}>
            <Icon name="info" color="gray.500" />
          </Tooltip>
        )}
      </Text>
    </Flex>
  );
};
