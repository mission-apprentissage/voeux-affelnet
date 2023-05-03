import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Formik, Field, Form } from "formik";
import {
  Alert,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  ListItem,
  Text,
  UnorderedList,
} from "@chakra-ui/react";

import { Yup } from "../common/Yup";
import { _post } from "../common/httpClient";
import { useQuery } from "../common/hooks/useQuery";
import useAuth from "../common/hooks/useAuth";
import { siretFormat, uaiFormat } from "../common/utils/format";

const mailVoeux = process.env.REACT_APP_VOEUX_AFFELNET_EMAIL;

const checkUsername = async (username, { path, createError }) => {
  try {
    if (username) {
      await _post("/api/login/test-username", { username });
    }
    return true;
  } catch (err) {
    if (!username?.match(siretFormat) && !username?.match(uaiFormat)) {
      return createError({
        path,
        message: "Vous devez indiquer un numéro de Siret ou Uai valide",
      });
    } else {
      const mailTo = `mailto:${mailVoeux}?subject=Problème de connexion (Identifiant ${username})`;
      return createError({
        path,
        message: (
          <Text>
            Cet identifiant ne correspond pas au Siret d'un organisme responsable enregistré comme tel dans Affelnet ni
            à l'UAI d'un organisme formateur. Veuillez utiliser l'identifiant figurant dans nos précédents emails. En
            cas de difficulté, veuillez contacter le service support en indiquant votre identifiant à{" "}
            <a href={mailTo}>{mailVoeux}</a>
          </Text>
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
    <Center height="100vh" verticalAlign="center" flexDirection={"column"}>
      <Box width={["auto", "48rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          {title}
        </Heading>

        <Alert mt={8}>
          <Box>
            <Text mb={4}>
              <strong>
                Le service de transmission des listes de candidats aux organismes de formation en apprentissage est
                actuellement fermé.
              </strong>
            </Text>
            <Text mb={4}>En 2023, la transmission des listes s’effectuera en trois temps :</Text>
            <Text mb={4}>
              <UnorderedList>
                <ListItem>
                  Mi-mai : une première campagne sera diffusée par courriel pour identifier les directeurs d’organismes
                  responsables, confirmer l’adresse email de réception, créer le mot de passe de connexion (les mots de
                  passe créés en 2022 ne seront pas utilisables).
                </ListItem>
                <ListItem>
                  Semaine du 5 juin : diffusion des listes de candidats sur l’adresse courriel confirmée.
                </ListItem>
                <ListItem>
                  Semaine du 3 juillet : diffusion des listes mises à jour. Une seule mise à jour sera diffusée (contre
                  deux en 2022).
                </ListItem>
              </UnorderedList>
            </Text>
            <Text mb={4}>
              Pour toute question, vous pouvez contacter l’équipe de diffusion par courriel :{" "}
              <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
              </Link>
            </Text>
          </Box>
        </Alert>

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
                              <FormHelperText mb={4}>
                                Votre identifiant figure dans nos correspondances courriel
                                <ul style={{ listStyle: "none" }}>
                                  <li>Organisme responsable : votre numéro de Siret</li>
                                  <li>Organisme formateur : votre code UAI</li>
                                  <li>Autres utilisateurs : prenom.nom</li>
                                </ul>
                              </FormHelperText>
                              <Input {...field} id={field.name} placeholder="Votre identifiant..." />
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
              <Alert status="info">
                <p>
                  Besoin d'aide ? Prenez contact avec un administrateur à l'adresse mail{" "}
                  <a href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                    {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                  </a>{" "}
                  en précisant votre identifiant ({username})
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
