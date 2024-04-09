import { useState, useEffect, useRef } from "react";
import {
  Box,
  Center,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { useFormik } from "formik";
import { _post, _get, _delete } from "../../common/httpClient";
import { ArrowDropRightLine } from "../../theme/components/icons";
import useAuth from "../../common/hooks/useAuth";

export const Alert = () => {
  const [messagesManuels, setMessagesManuels] = useState([]);

  const [user] = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    const run = async () => {
      if (mountedRef.current) {
        try {
          const data = await _get("/api/alert");

          setMessagesManuels(data);
        } catch (e) {
          console.error(e);
        }
      }
    };
    run();

    return () => {
      mountedRef.current = false;
    };
  }, []);

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
            alert("Le message a bien été envoyé.");
          }
          window.location.reload();
        } catch (e) {
          console.log(e);
        }

        setSubmitting(false);
        resolve("onSubmitHandler complete");
      });
    },
  });

  // const toggleMessage = async (message) => {
  //   try {
  //     await _patch(`/api/admin/alert/${message._id}`, {
  //       enabled: !message.enabled,
  //     });
  //     window.location.reload();
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  const deleteMessage = async (message) => {
    try {
      const messageDeleted = await _delete(`/api/admin/alert/${message._id}`);
      if (messageDeleted) {
        alert("Le message a bien été supprimé.");
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
      <Container maxW="xl">
        <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
          <BreadcrumbItem>
            <BreadcrumbLink as={NavLink} to="/" color="grey.600" textDecoration="underline">
              Accueil
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Message de maintenance</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Container>
      <Container maxW="xl">
        <Center verticalAlign="center">
          <Box mt={10} width={["auto", "50rem"]}>
            <Heading textStyle="h2" marginBottom="2w">
              Message de maintenance
            </Heading>
            <Box>
              <FormControl as="fieldset">
                <FormLabel as="legend">Liste des messages manuels: </FormLabel>
                <Box>
                  <VStack wrap="none">
                    {messagesManuels.map((message, index) => {
                      return (
                        <Box w="100%" display={"inline-flex"} key={index}>
                          <Box w="80%">
                            <Textarea disabled>{message.msg}</Textarea>
                          </Box>
                          <Box w="20%" alignSelf="right" alignItems="right">
                            <Button textStyle="sm" variant="danger" onClick={() => deleteMessage(message)}>
                              Supprimer
                            </Button>
                          </Box>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              </FormControl>

              <FormControl as="fieldset" mt={5}>
                <FormLabel as="legend">Ajouter un message manuel: </FormLabel>
                <Textarea
                  name="msg"
                  value={valuesM.msg}
                  onChange={handleChangeM}
                  placeholder="Saisissez un message manuel"
                  rows={3}
                  required
                />
                <Box mt="1rem" textAlign="right">
                  <Button textStyle="sm" variant="primary" disabled={!valuesM.msg?.length} onClick={handleSubmitM}>
                    Enregistrer et activer
                  </Button>
                </Box>
              </FormControl>
            </Box>
          </Box>
        </Center>
      </Container>
    </Box>
  );
};
