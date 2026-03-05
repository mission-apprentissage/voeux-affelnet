import { Flex, Icon, Text, Tooltip } from "@chakra-ui/react";
import useAuth from "../../hooks/useAuth";
import { isAdmin } from "../../utils/aclUtils";

export const HistoryItem = ({ history }) => {
  const [auth] = useAuth();

  const date = new Date(history.date);

  return (
    <Flex alignItems={"center"}>
      <Text color={history.old ? "gray.400" : "gray.500"} minW={"174px"} align={"right"}>
        {date.toLocaleDateString()} à {date.toLocaleTimeString()}
      </Text>
      <Text borderLeft={history.old ? "2px solid gray" : "2px solid black"} ml={4} pl={4}>
        <Text as="span" color={history.old ? "gray.500" : "black"}>
          {history.value}
        </Text>{" "}
        {isAdmin(auth) && (
          <Tooltip label={history.action}>
            <Icon name="info" color={history.old ? "gray.400" : "gray.500"} />
          </Tooltip>
        )}
      </Text>
    </Flex>
  );
};
