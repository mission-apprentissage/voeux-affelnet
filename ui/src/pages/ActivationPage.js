import React, { useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import { Field, Form, Formik } from "formik";
import {
  Center,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  Text,
  Link,
  Alert,
} from "@chakra-ui/react";

import { Yup } from "../common/Yup";
import { _post } from "../common/httpClient";
import useAuth from "../common/hooks/useAuth";
import decodeJWT from "../common/utils/decodeJWT";
import { useFetch } from "../common/hooks/useFetch";

function StatusErrorMessage({ error, username }) {
  const navigate = useNavigate();
  console.log(error);
  if (error.statusCode === 401) {
    return (
      <Alert status="error">
        <Text>
          Ce lien est expiré ou invalide, merci de prendre contact avec un administrateur votre identifiant ({username})
          via :&nbsp;
          <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
            {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
          </Link>
        </Text>
      </Alert>
    );
  } else if (error.statusCode === 400) {
    navigate(`/login?alreadyActivated=true&username=${username}`);
  }
  return <div />;
}

function ActivationPage() {
  const [, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { actionToken } = queryString.parse(location.search);
  const [message, setMessage] = useState();
  const username = decodeJWT(actionToken).sub;
  const [, loading, error] = useFetch(`/api/activation/status?username=${username}&token=${actionToken}`);

  const activation = useCallback(
    async (values) => {
      try {
        const { token } = await _post("/api/activation", { ...values, actionToken });
        setAuth(token);
        navigate("/");
      } catch (e) {
        console.error(e);

        setMessage(<StatusErrorMessage error={e} username={username} />);
      }
    },
    [actionToken, navigate, setAuth, username]
  );

  const showForm = !loading && !message && !error;
  const title = `Activation de votre compte ${username}`;

  return (
    <Center height="100vh" verticalAlign="center">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          {title}
        </Heading>

        <Box mt={8}>
          {error && <StatusErrorMessage error={error} username={username} />}
          {loading && <div>En cours de chargement...</div>}
          {showForm && (
            <Box>
              <Text mb={8}>
                Afin d’accéder au service de téléchargement des listes de vœux exprimés via Affelnet, nous vous prions
                d’activer votre compte en créant un mot de passe.
              </Text>
              <Formik
                initialValues={{
                  password: "",
                }}
                validationSchema={Yup.object().shape({
                  password: Yup.string()
                    .required("Veuillez saisir un mot de passe")
                    .matches(
                      "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[ !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~])[A-Za-z\\d !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~]{8,}$",
                      "Le mot de passe doit contenir au moins 8 caractères, une lettre en majuscule, un chiffre et un caractère spécial"
                    ),
                })}
                onSubmit={activation}
              >
                {({ status = {} }) => {
                  return (
                    <Form>
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
                      <Button variant="primary" type="submit">
                        Activer le compte
                      </Button>
                      {status.error && (
                        <Text color="error" mt={2}>
                          {status.error}
                        </Text>
                      )}
                    </Form>
                  );
                }}
              </Formik>
            </Box>
          )}
        </Box>
      </Box>
    </Center>
  );
}

export default ActivationPage;
