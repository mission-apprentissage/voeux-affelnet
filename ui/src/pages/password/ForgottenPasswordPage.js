import React from "react";
import { Field, Form, Formik } from "formik";

import {
  Alert,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react";

import { useQuery } from "../../common/hooks/useQuery";
import { Yup } from "../../common/Yup";
import { _post } from "../../common/httpClient";
import { AlertMessage } from "../../common/components/layout/AlertMessage";

const ForgottenPasswordPage = () => {
  const query = useQuery();
  const username = query.get("username");

  const resetPassword = async (values, { setStatus }) => {
    try {
      await _post("/api/password/forgotten-password", { ...values });
      setStatus({ message: "Un email vous a été envoyé." });
    } catch (e) {
      console.error(e);
      setStatus({ error: "Identifiant invalide ou compte non activé." });
    }
  };

  const title = "Mot de passe oublié";

  return (
    <Grid height="100vh" gridTemplateAreas={`'top' 'bottom'`} gridTemplateRows="max-content">
      <AlertMessage gridArea="top" />

      <Center gridArea="bottom" verticalAlign="center">
        <Box width={["auto", "28rem"]}>
          <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
            {title}
          </Heading>
          <Box mt={8}>
            <Formik
              initialValues={{
                username: username ?? "",
              }}
              validationSchema={Yup.object().shape({
                username: Yup.string().required("Veuillez saisir un identifiant"),
              })}
              onSubmit={resetPassword}
            >
              {({ status = {} }) => {
                return (
                  <Form>
                    <Field name="username">
                      {({ field, meta }) => {
                        return (
                          <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                            <FormLabel>Identifiant</FormLabel>
                            <Input {...field} id={field.name} placeholder="Votre identifiant..." />
                            <FormErrorMessage>{meta.error}</FormErrorMessage>
                          </FormControl>
                        );
                      }}
                    </Field>
                    <Button variant="primary" type={"submit"}>
                      Demander un nouveau mot de passe
                    </Button>
                    {status.error && (
                      <Text color="error" mt={2}>
                        {status.error}
                      </Text>
                    )}
                    {status.message && (
                      <Text color="info" mt={2}>
                        {status.message}
                      </Text>
                    )}
                  </Form>
                );
              }}
            </Formik>
          </Box>

          <Box mt={8}>
            <Alert status="info">
              <Box>
                <Text>Votre identifiant figure dans nos correspondances courriel.</Text>
              </Box>
            </Alert>
          </Box>
        </Box>
      </Center>
    </Grid>
  );
};

export default ForgottenPasswordPage;
