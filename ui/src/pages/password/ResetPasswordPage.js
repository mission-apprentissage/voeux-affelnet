import React from "react";
import queryString from "query-string";
import * as Yup from "yup";
import { Formik, Field, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Center, FormControl, FormErrorMessage, FormLabel, Heading, Input, Button } from "@chakra-ui/react";

import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import decodeJWT from "../../common/utils/decodeJWT";
import ErrorMessage from "../../common/components/ErrorMessage";

function ResetPasswordPage() {
  const [, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPasswordToken } = queryString.parse(location.search);
  const username = decodeJWT(resetPasswordToken).sub;

  const showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {};
  };

  const changePassword = async (values, { setStatus }) => {
    try {
      const { token } = await _post("/api/password/reset-password", { ...values, resetPasswordToken });
      setAuth(token);
      navigate("/");
    } catch (e) {
      console.error(e);
      setStatus({
        error: (
          <span>
            Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
            mail de réception des voeux ou votre siret via :
            <br />
            <a href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
              {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
            </a>
          </span>
        ),
      });
    }
  };

  return (
    <Center height="100vh" verticalAlign="center">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          Changement du mot de passe pour le CFA {username}
        </Heading>
        <Box mt={8}>
          <Formik
            initialValues={{
              newPassword: "",
            }}
            validationSchema={Yup.object().shape({
              newPassword: Yup.string()
                .required("Veuillez saisir un mot de passe")
                .matches(
                  "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[ !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~])[A-Za-z\\d !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~]{8,}$",
                  "Le mot de passe doit contenir au moins 8 caractères, une lettre en majuscule, un chiffre et un caractère spécial"
                ),
            })}
            onSubmit={changePassword}
          >
            {({ status = {} }) => {
              return (
                <Form>
                  <Field name="newPassword">
                    {({ field, meta }) => {
                      return (
                        <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                          <FormLabel>Nouveau mot de passe</FormLabel>
                          <Input {...field} id={field.name} type="password" placeholder="Votre mot de passe..." />
                          <FormErrorMessage>{meta.error}</FormErrorMessage>
                        </FormControl>
                      );
                    }}
                  </Field>
                  <Button variant="primary" className="text-left" type={"submit"}>
                    Réinitialiser le mot de passe
                  </Button>
                  {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
                </Form>
              );
            }}
          </Formik>
        </Box>
      </Box>
    </Center>
  );
}

export default ResetPasswordPage;
