import { useCallback, useEffect, useState } from "react";
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

import { _post } from "../common/httpClient";
import useAuth from "../common/hooks/useAuth";
import decodeJWT from "../common/utils/decodeJWT";
import { useFetch } from "../common/hooks/useFetch";
import { passwordConfirmationSchema } from "../common/utils/validationUtils";

function StatusErrorMessage({ error, username }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (error.statusCode === 400) {
      navigate(`/login?alreadyActivated=true&username=${username}`);
    }
  }, [error?.statusCode, username, navigate]);

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
        const { token } = await _post("/api/activation", { password: values.password, actionToken });
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
  const title = `Veuillez définir votre mot de passe de connexion`;

  return (
    <Center height="100vh" verticalAlign="center">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          {title}
        </Heading>

        <Box mt={8}>
          <Box mb={8}>
            {error && <StatusErrorMessage error={error} username={username} />}
            {loading && <div>En cours de chargement...</div>}
            {showForm && (
              <Box>
                <Formik
                  initialValues={{
                    password: "",
                    password_confirmation: "",
                  }}
                  validationSchema={passwordConfirmationSchema}
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
                        <Field name="password_confirmation">
                          {({ field, meta }) => {
                            return (
                              <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                                <FormLabel name={field.name}>Confirmation du mot de passe</FormLabel>
                                <Input
                                  {...field}
                                  id={field.name}
                                  type="password"
                                  placeholder="Confirmation de votre mot de passe..."
                                />
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

        <Box mb={4}>
          <Link href="/support" variant="action">
            Besoin d'assistance ?
          </Link>
        </Box>
      </Box>
    </Center>
  );
}

export default ActivationPage;
