import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Alert, AlertIcon, AlertDescription, Text, Flex } from "@chakra-ui/react";
import { _get } from "../../httpClient";
import { useDocumentVisibility } from "../../hooks/useDocumentVisibilty";

export const AlertMessage = () => {
  const [messages, setMessages] = useState([]);
  const mounted = useRef(false);
  const isDocumentVisible = useDocumentVisibility();

  const getMessages = useCallback(async () => {
    try {
      const data = await _get("/api/alert");
      setMessages(data?.filter((item) => item.enabled) ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      mounted.current = true;
      await getMessages();
    };

    if (!mounted.current) {
      run();
    }

    return () => {
      mounted.current = false;
    };
  }, [getMessages]);

  useEffect(() => {
    let interval;

    interval = setInterval(async () => {
      if (isDocumentVisible) {
        await getMessages();
      } else {
        console.log("Document is not visible, skipping message fetch");
      }
    }, 30000);

    return () => {
      interval && clearInterval(interval);
    };
  }, [getMessages, isDocumentVisible]);

  if (messages.length === 0) return null;

  return (
    <Box m={0} fontSize={["omega", "omega", "epsilon"]} data-testid="container">
      <Alert status="error" flexDirection={["column", "column", "column", "row"]} m={0}>
        <Flex m={0} p={0}>
          <Flex m={0}>
            <AlertIcon boxSize={6} />
          </Flex>
        </Flex>
        <AlertDescription m={0} pl={2}>
          {messages?.map(
            (element) =>
              element.enabled && (
                <Text data-testid={element._id} key={element._id}>
                  • {element.msg}
                </Text>
              )
          )}
        </AlertDescription>
      </Alert>
    </Box>
  );
};
