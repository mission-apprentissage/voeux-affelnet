import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import queryString from "query-string";

import { Field, Form, Formik } from "formik";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
} from "@chakra-ui/react";

import { Yup } from "../common/Yup";
import { _post } from "../common/httpClient";
import decodeJWT from "../common/utils/decodeJWT";
import ErrorMessage from "../common/components/ErrorMessage";
import { useFetch } from "../common/hooks/useFetch";

function ServerErrorMessage() {
  return (
    <Alert status="error">
      <Box>
        <Text>
          Une erreur est survenue, merci de prendre contact avec un administrateur en précisant votre identifiant via :{" "}
          <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
            {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
          </Link>
          .
        </Text>
      </Box>
    </Alert>
  );
}

function StatusErrorMessage({ error, username }) {
  if (error) {
    if (error.statusCode === 401) {
      return (
        <Alert status="error" variant="left-accent">
          <AlertIcon />
          <Box>
            <Text>
              Ce lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre
              Identifiant ({username}) via :{" "}
              <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
              </Link>
              .
            </Text>
          </Box>
        </Alert>
      );
    } else if (error.statusCode === 400) {
      return (
        <Alert status="info" variant="left-accent">
          <AlertIcon />
          <Box>
            <Text mb={4}>
              L’adresse courriel a déjà été confirmée pour votre établissement (Identifiant {username}).
            </Text>
            <Text mb={4}>
              C’est à cette adresse que les listes de candidats seront transmises, à partir de la semaine du 5 juin.
            </Text>
            <Text>
              Si vous pensez qu’il s’agit d’une erreur, veuillez le signaler en envoyant un courriel à :{" "}
              <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
              </Link>
              .
            </Text>
          </Box>
        </Alert>
      );
    }
  }

  return <div />;
}

const ConfirmationPage = () => {
  const location = useLocation();
  const { actionToken } = queryString.parse(location.search);
  const username = decodeJWT(actionToken).sub;
  const [data, loading, error] = useFetch(`/api/confirmation/status?username=${username}&token=${actionToken}`);
  const [message, setMessage] = useState();
  const [inputDisabled, setInputDisabled] = useState(true);

  const [title, setTitle] = useState(<>Confirmation de l'email</>);
  const accept = async (values) => {
    try {
      await _post("/api/confirmation/accept", { email: values.email, actionToken });
      setTitle(<>Dernière étape : définir votre mot de passe de connexion.</>);
      setMessage(
        <Alert status="success" variant="left-accent">
          <AlertIcon />
          <Box>
            <Text>
              Un nouveau message vient de vous être envoyé, avec un lien vous permettant de définir votre mot de passe.
            </Text>
          </Box>
        </Alert>
      );
    } catch (e) {
      console.error(e);
      setMessage(<ServerErrorMessage />);
    }
  };

  const showForm = !loading && !message && data;

  return (
    <Center height="100vh" verticalAlign="center">
      <Box width={["auto", "28rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          {title}
        </Heading>
        <Box mt={8}>
          <Box mb={8}>
            {message}
            {error && <StatusErrorMessage error={error} username={username} />}
            {loading && <div>En cours de chargement...</div>}
            {showForm && (
              <Box>
                <Text mb={4}>
                  Afin d’accéder au téléchargement des candidats en apprentissage exprimés via Affelnet, veuillez
                  confirmer{" "}
                  {data.type === "Gestionnaire" ? (
                    <>l’adresse courriel du directeur général de votre établissement (Siret: {username})</>
                  ) : (
                    <>
                      l'adresse courriel renseignée par le directeur général de l'établissement responsable pour
                      délégation des droits de téléchargements des listes de candidats à votre compte (UAI: {username})
                    </>
                  )}
                </Text>
                <Text mb={8}>
                  Cette étape est indispensable pour vous permettre de recevoir les listes de candidats qui seront
                  diffusées à partir de la semaine du 5 juin.
                </Text>

                <Formik
                  initialValues={{
                    email: data?.email,
                    email_validation: data?.email,
                  }}
                  validationSchema={Yup.object().shape({
                    email: Yup.string().email().required(),
                    email_confirmation: Yup.string()
                      .required("Requis")
                      .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
                  })}
                  onSubmit={accept}
                >
                  {({ status = {} }) => {
                    return (
                      <Form>
                        <Field name="email">
                          {({ field, meta }) => {
                            return (
                              <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                                <FormLabel name={field.name}>Email</FormLabel>
                                <Input
                                  mb={2}
                                  {...field}
                                  id={field.name}
                                  type="email"
                                  placeholder="Nouvelle adresse courriel..."
                                  disabled={inputDisabled}
                                />

                                {inputDisabled && (
                                  <Link variant="action" mb={4} float="right" onClick={() => setInputDisabled(false)}>
                                    Modifier l'adresse courriel
                                  </Link>
                                )}
                                <FormErrorMessage>{meta.error || "Adresse invalide"}</FormErrorMessage>
                              </FormControl>
                            );
                          }}
                        </Field>

                        {!inputDisabled && (
                          <Field name="email_confirmation">
                            {({ field, meta }) => {
                              return (
                                <FormControl isRequired isInvalid={meta.error && meta.touched} marginBottom="2w">
                                  <FormLabel name={field.name}>Confirmation de l'email</FormLabel>
                                  <Input
                                    mb={2}
                                    {...field}
                                    id={field.name}
                                    type="email"
                                    placeholder="Veuillez confirmer la nouvelle adresse..."
                                    disabled={inputDisabled}
                                  />
                                  <FormErrorMessage>{meta.error || "Adresse invalide"}</FormErrorMessage>
                                </FormControl>
                              );
                            }}
                          </Field>
                        )}

                        <Button variant="primary" type="submit" mb={4}>
                          Confirmer l'email pour l'établissement {username}
                        </Button>

                        <Box mb={4}>{status?.error && <ErrorMessage>{status?.error}</ErrorMessage>}</Box>

                        {/* <Text mb={4}>
                          <Text as="i">
                            L’
                            <Link href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000035274717/2020-11-09/">
                              arrêté du 17 juillet 2017
                            </Link>
                            , au 7e alinéa de l’article 4, précise que seuls les directeurs des organismes responsables
                            des offres de formation sont habilités à recevoir les données transmises mentionnées à
                            l’article 3 de ce même arrêté. En 2023, un arrêté (à paraître) permet aux directeurs
                            d'organismes responsables de déléguer les droits de réception directe des listes de
                            candidats à d'autres personnes.
                          </Text>
                        </Text> */}
                      </Form>
                    );
                  }}
                </Formik>
              </Box>
            )}
          </Box>

          <Box mb={4}>
            <Link href="/support" variant="action">
              Besoin d'assistance ?
            </Link>
          </Box>
        </Box>
      </Box>
    </Center>
  );
};

export default ConfirmationPage;
