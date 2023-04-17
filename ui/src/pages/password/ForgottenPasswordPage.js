import React from "react";
import { useNavigate } from "react-router-dom";
import { Field, Form, Formik } from "formik";
import {
  Alert,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react";

import { Yup } from "../../common/Yup";
import { _post } from "../../common/httpClient";

const ForgottenPasswordPage = () => {
  const navigate = useNavigate();

  const resetPassword = async (values, { setStatus }) => {
    try {
      await _post("/api/password/forgotten-password", { ...values });
      setStatus({ message: "Un email vous a été envoyé." });
      setTimeout(() => navigate("/"), 1500);
    } catch (e) {
      console.error(e);
      setStatus({ error: "Identifiant invalide ou compte non activé." });
    }
  };

  const title = "Mot de passe oublié";

  return (
    <Center height="100vh" verticalAlign="center">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          {title}
        </Heading>
        <Box mt={8}>
          <Formik
            initialValues={{
              username: "",
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
                          <Input {...field} id={field.name} placeholder="Votre identifiant (Siret)..." />
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
              <Text>Le siret figure dans l'objet du mail que vous avez précédemment reçu.</Text>
            </Box>
          </Alert>
        </Box>
      </Box>
    </Center>
  );
};

export default ForgottenPasswordPage;
