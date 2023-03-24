import React from "react";
import * as Yup from "yup";
import { Alert } from "tabler-react";

import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Center,
  Box,
  Heading,
  HStack,
  Link,
  Text,
} from "@chakra-ui/react";
import { Formik, Field, Form } from "formik";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "../common/hooks/useQuery";
import useAuth from "../common/hooks/useAuth";
import { _post } from "../common/httpClient";
import { siretFormat } from "../common/utils/format";

const mailVoeux = process.env.REACT_APP_VOEUX_AFFELNET_EMAIL;

const checkUsername = async (username, { path, createError }) => {
  try {
    if (username) {
      await _post("/api/login/test-username", { username });
    }
    return true;
  } catch (err) {
    if (!username?.match(siretFormat)) {
      return createError({
        path,
        message: "Vous devez indiquer un numéro de Siret valide",
      });
    } else {
      const mailTo = `mailto:${mailVoeux}?subject=Problème de connexion (SIRET ${username})`;
      return createError({
        path,
        message: (
          <>
            Ce numéro de Siret ne correspond pas à un organisme responsable enregistré comme tel dans Affelnet. Veuillez
            utiliser le numéro de Siret figurant dans nos précédent emails. En cas de difficulté, veuillez contacter le
            service support en indiquant votre Siret : <a href={mailTo}>{mailVoeux}</a>
          </>
        ),
      });
    }
  }
};

function LoginPage() {
  const [, setAuth] = useAuth();
  const navigate = useNavigate();
  const query = useQuery();
  const username = query.get("username");
  const alreadyActivated = query.get("alreadyActivated");

  const feedback = (meta, message) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error || message,
          invalid: true,
        }
      : {};
  };

  const login = async (values, { setStatus }) => {
    try {
      const { token } = await _post("/api/login", values);
      setAuth(token);
      navigate("/");
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  const title = "Connexion";
  return (
    <Center height="100vh" verticalAlign="center">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          {title}
        </Heading>

        <Box mt={8}>
          <Formik
            initialValues={{
              username: username ?? "",
              password: "",
            }}
            validationSchema={Yup.object().shape({
              username: Yup.string().required("Requis").test("Username valide", checkUsername),
              password: Yup.string().required("Requis"),
            })}
            onSubmit={login}
          >
            {({ status = {} }) => {
              return (
                <Form>
                  <Box marginBottom="2w">
                    <FormControl label="Identifiant">
                      <Field name="username">
                        {({ field, meta }) => {
                          return (
                            <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                              <FormLabel name={field.name}>Identifiant</FormLabel>
                              <Input {...field} id={field.name} placeholder="Votre identifiant (Siret)..." />
                              <FormErrorMessage>{meta.error || "Identifiant invalide"}</FormErrorMessage>
                            </FormControl>
                          );
                        }}
                      </Field>
                    </FormControl>
                    <FormControl label="Mot de passe">
                      <Field name="password">
                        {({ field, meta }) => {
                          return (
                            <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                              <FormLabel name={field.name}>Mot de passe</FormLabel>
                              <Input {...field} id={field.name} type="password" placeholder="Votre mot de passe..." />
                              <FormErrorMessage>{meta.error || "Mot de passe invalide"}</FormErrorMessage>
                            </FormControl>
                          );
                        }}
                      </Field>
                    </FormControl>
                  </Box>

                  <HStack spacing="4w">
                    <Button variant="primary" type="submit">
                      Connexion
                    </Button>
                    <Link to="/forgotten-password" as={NavLink} color="grey.500">
                      Mot de passe oublié
                    </Link>
                  </HStack>

                  {status.error && (
                    <Text color="error" mt={2}>
                      {status.error}
                    </Text>
                  )}
                </Form>
              );
            }}
          </Formik>

          <Box mt={8}>
            {alreadyActivated && (
              <Alert type={"info"}>
                <p>
                  Besoin d'aide ? Prenez contact avec un administrateur à l'adresse mail{" "}
                  <a href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                    {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                  </a>{" "}
                  en précisant votre siret ({username})
                </p>
              </Alert>
            )}
          </Box>
        </Box>
      </Box>
    </Center>
  );
}

export default LoginPage;
