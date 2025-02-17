import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Center,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Container,
  Textarea,
  VStack,
  useToast,
  Switch,
  IconButton,
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { useFormik } from "formik";
import { _post, _get, _delete, _patch } from "../../common/httpClient";
import { ArrowDropRightLine } from "../../theme/components/icons";
import useAuth from "../../common/hooks/useAuth";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Page } from "../../common/components/layout/Page";

export const Alert = () => {
  const [messages, setMessages] = useState([]);
  const toast = useToast();
  const [user] = useAuth();
  const mountedRef = useRef(true);

  const getMessages = useCallback(async () => {
    try {
      const data = await _get("/api/alert");

      setMessages(data.map((message) => ({ ...message, initialValue: message.msg })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      if (mountedRef.current) {
        await getMessages();
      }
    };
    run();

    return () => {
      mountedRef.current = false;
    };
  }, [getMessages]);

  const {
    values: valuesM,
    handleSubmit: handleSubmitM,
    handleChange: handleChangeM,
  } = useFormik({
    initialValues: {
      msg: "",
    },
    onSubmit: ({ msg }, { setSubmitting }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const message = {
            msg,
            name: user.email,
            enabled: true,
          };
          const messagePosted = await _post("/api/admin/alert", message);
          if (messagePosted) {
            toast({ description: "Le message a été ajouté." });
          }
          await getMessages();
        } catch (e) {
          console.log(e);
        }

        setSubmitting(false);
        resolve("onSubmitHandler complete");
      });
    },
  });

  const toggleMessage = useCallback(
    async (message) => {
      try {
        const messageUpdated = await _patch(`/api/admin/alert/${message._id}`, {
          enabled: !message.enabled,
        });

        if (messageUpdated) {
          toast({ description: message.enabled ? "Le message a été désactivé." : "Le message a été activé." });
        }

        await getMessages();
      } catch (e) {
        console.error(e);
      }
    },
    [getMessages, toast]
  );

  const toggleMessageEditing = useCallback(
    (message) => {
      setMessages([
        ...messages.map((m) =>
          m._id === message._id ? { ...m, editing: !message.editing, msg: message.initialValue } : m
        ),
      ]);
    },
    [messages]
  );

  const updateMessage = useCallback(
    (message, value) => {
      setMessages([...messages.map((m) => (m._id === message._id ? { ...m, msg: value } : m))]);
    },
    [messages]
  );

  const editMessage = useCallback(
    async (message, description) => {
      try {
        const messageUpdated = await _patch(`/api/admin/alert/${message._id}`, {
          msg: description,
        });

        if (messageUpdated) {
          toast({ description: "Le message a été modifié." });
        }

        await getMessages();
      } catch (e) {
        console.error(e);
      }
    },
    [getMessages, toast]
  );

  const deleteMessage = useCallback(
    async (message) => {
      try {
        const messageDeleted = await _delete(`/api/admin/alert/${message._id}`);
        if (messageDeleted) {
          toast({ description: "Le message a bien été supprimé." });
        }
        await getMessages();
      } catch (e) {
        console.error(e);
      }
    },
    [getMessages, toast]
  );

  return (
    <>
      <Breadcrumb items={[{ label: "Gestion des messages de maintenance", url: "/admin/alert" }]} />

      <Page title={"Messages de maintenance"}>
        {!!messages.length && (
          <FormControl as="fieldset" mt={12}>
            <FormLabel as="legend">
              <Heading as="h3" size="md" mb={4}>
                Liste des messages :
              </Heading>
            </FormLabel>
            <Box>
              <VStack wrap="none">
                {messages.map((message) => {
                  return (
                    <Box w="100%" display={"inline-flex"} key={message._id}>
                      <Box
                        w="10%"
                        alignSelf="right"
                        alignItems="right"
                        display={"inline-flex"}
                        marginLeft="4"
                        marginRight="4"
                      >
                        <Switch
                          size="md"
                          m="auto"
                          isChecked={message.enabled}
                          onChange={() => toggleMessage(message)}
                          aria-label={message.enabled ? "Désactiver" : "Activer"}
                        />
                      </Box>

                      <Box w="80%">
                        <Textarea
                          disabled={!message.editing}
                          onChange={(e) => updateMessage(message, e.target.value)}
                          value={message.msg}
                        />
                      </Box>
                      <Box
                        w="10%"
                        alignSelf="right"
                        alignItems="right"
                        display={"inline-flex"}
                        marginLeft="4"
                        marginRight="4"
                      >
                        <IconButton
                          variant="ghost"
                          colorScheme="blue"
                          aria-label="Editer"
                          fontSize="20px"
                          m="auto"
                          icon={message.editing ? <CheckIcon /> : <EditIcon />}
                          onClick={() =>
                            message.editing ? editMessage(message, message.msg) : toggleMessageEditing(message)
                          }
                        />
                        <IconButton
                          variant="ghost"
                          colorScheme="red"
                          aria-label="Supprimer"
                          fontSize="20px"
                          m="auto"
                          icon={message.editing ? <CloseIcon /> : <DeleteIcon />}
                          onClick={() => (message.editing ? toggleMessageEditing(message) : deleteMessage(message))}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </FormControl>
        )}

        <FormControl as="fieldset" mt={12}>
          <Heading as="h3" size="md" mb={4}>
            Ajouter un message :
          </Heading>
          <Textarea
            name="msg"
            value={valuesM.msg}
            onChange={handleChangeM}
            placeholder="Saisissez un message"
            rows={3}
            required
          />
          <Box mt="1rem" textAlign="right">
            <Button textStyle="sm" variant="primary" disabled={!valuesM.msg?.length} onClick={handleSubmitM}>
              Enregistrer et activer
            </Button>
          </Box>
        </FormControl>
      </Page>
    </>
  );
};
