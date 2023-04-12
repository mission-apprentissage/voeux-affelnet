import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import * as Yup from "yup";
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
  Link,
  Text,
} from "@chakra-ui/react";

import { _post } from "../common/httpClient";
import decodeJWT from "../common/utils/decodeJWT";
import ErrorMessage from "../common/components/ErrorMessage";
import { useFetch } from "../common/hooks/useFetch";

function ServerErrorMessage() {
  return (
    <Alert status="error">
      <Box>
        <Text mb={4}>
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
        <Alert status="error">
          <Box>
            <Text mb={4}>
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
        <Alert status="info">
          <Box>
            <Text mb={4}>
              L’adresse courriel a déjà été confirmée pour votre établissement (Identifiant {username}).
            </Text>
            <Text mb={4}>
              C’est à cette adresse que les listes de vœux seront transmises, à partir de la semaine du 6 juin.
            </Text>
            <Text mb={4}>
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

  const accept = async (values) => {
    try {
      await _post("/api/confirmation/accept", { ...values, actionToken });
      setMessage(
        <Alert status="info">
          <Box>
            <Text mb={4}>Merci, nous avons pris en compte votre confirmation.</Text>
            <Text mb={4}>
              La transmission de listes de vœux s’effectuera en 3 temps : dans la semaine du 6 juin, dans la semaine du
              20 juin et dans la semaine du 4 juillet. Des courriels seront envoyés à chacune de ces dates à l’adresse
              indiquée, uniquement si des vœux sont exprimés sur votre établissement et/ou l’un des établissements dont
              vous avez la charge.
            </Text>
            <Text mb={4}>
              Le premier courriel invitera à définir un mot de passe pour accès à l’espace de téléchargement.
            </Text>
            <Text mb={4}>
              Si votre établissement est responsable d’autres établissements d’accueil, la connexion au compte permettra
              de télécharger les listes pour chaque établissement sur lequel des vœux ont été exprimés.
            </Text>
            <Text mb={4}>
              Pour toute question, vous pouvez prendre contact avec un administrateur en précisant votre numéro{" "}
              {data.type === "Gestionnaire" ? <>Siret</> : <>UAI</>} ({username}) via :{" "}
              <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
              </Link>
              .
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
          Confirmation de l'email pour le compte <strong>{username}</strong>
        </Heading>
        <Box mt={8}>
          {message}
          {error && <StatusErrorMessage error={error} username={username} />}
          {loading && <div>En cours de chargement...</div>}
          {showForm && (
            <Box>
              <Text mb={4}>
                Afin d’accéder au téléchargement des vœux en apprentissage exprimés via Affelnet, veuillez confirmer{" "}
                {data.type === "Gestionnaire" ? (
                  <>l’adresse courriel du directeur général de votre établissement (Siret: {username})</>
                ) : (
                  <>
                    l'adresse courriel renseignée par le directeur général de l'établissement responsable pour
                    délégation des droits de téléchargements des listes de vœux à votre compte (UAI: {username})
                  </>
                )}
              </Text>
              <Text mb={8}>
                Cette étape est indispensable pour vous permettre de recevoir les listes de vœux qui seront diffusées à
                partir de la semaine du 6 juin.
              </Text>

              <Formik
                initialValues={{
                  email: data?.email,
                }}
                validationSchema={Yup.object().shape({
                  email: Yup.string().email().required(),
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
                              <Input {...field} id={field.name} type="email" placeholder="Nouvelle adresse email..." />
                              <FormErrorMessage>{meta.error || "Email invalide"}</FormErrorMessage>
                            </FormControl>
                          );
                        }}
                      </Field>

                      <Button variant="primary" type="submit" mb={8}>
                        Confirmer l'email pour l'établissement {username}
                      </Button>

                      {/** TODO : Changer texte */}
                      <Text mt={4}>
                        <Text as="i">
                          L’
                          <Link href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000035274717/2020-11-09/">
                            arrêté du 17 juillet 2017
                          </Link>
                          , au 7e alinéa de l’article 4, précise que seuls les directeurs des centres de formation
                          d'apprentis sont habilités à recevoir les données transmises mentionnées à l’article 3 de ce
                          même arrêté.
                        </Text>
                      </Text>
                      {status?.error && <ErrorMessage>{status?.error}</ErrorMessage>}
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
};

export default ConfirmationPage;
