import React, { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Formik, Field, Form } from "formik";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
import decodeJWT from "../common/utils/decodeJWT";
import * as queryString from "query-string";
import { useFetch } from "../common/hooks/useFetch";
import { UserStatut } from "../common/constants/UserStatut";

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
  const alreadyActivated = query.get("alreadyActivated");

  const location = useLocation();
  const { actionToken } = queryString.parse(location.search);
  const username = decodeJWT(actionToken)?.sub || query.get("username");
  const [data, loading, error] = useFetch(`/api/login/status?username=${username}&token=${actionToken}`);

  console.log({ data, loading, error });

  useEffect(() => {
    switch (data?.statut) {
      case UserStatut.EN_ATTENTE:
        navigate(`/confirmation?actionToken=${actionToken}`, { replace: true });
        break;
      case UserStatut.CONFIRME:
        navigate(`/activation?actionToken=${actionToken}`, { replace: true });
        break;
      default:
        break;
    }
  }, [data?.statut, actionToken, navigate]);

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

        <Box mb={8}>
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
        </Box>
        <Box mb={8}>
          {alreadyActivated ? (
            <Alert status="info">
              <Text mb={4}>
                Besoin d'aide ? Prenez contact avec un administrateur à l'adresse mail{" "}
                <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                  {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                </Link>{" "}
                en précisant votre identifiant ({username})
              </Text>
            </Alert>
          ) : (
            <Alert display={"flex"} flexDirection={"column"}>
              <Text mb={4}>
                <strong>
                  Les mots de passe utilisés en 2022 ne sont plus valables, de nouveaux comptes doivent être créés. Des
                  courriels ont été diffusés aux organismes de formation en apprentissage les 12 et 15 mai, pour
                  permettre de créer leur compte et définir leur mot de passe de connexion. Seuls les organismes
                  responsables des offres sont destinataires de ces premières correspondances.
                </strong>
              </Text>

              <Text mb={4}>
                Pour toute question, vous pouvez consulter notre{" "}
                <Link variant="action" href={"/support"}>
                  page support
                </Link>
                , ou contacter l’équipe de diffusion par courriel :{" "}
                <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                  {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                </Link>
              </Text>

              <Box w="100%">
                <Accordion defaultIndex={[]} allowToggle>
                  <AccordionItem mb={0}>
                    <h2>
                      <AccordionButton>
                        <Box as="span" flex="1" textAlign="left">
                          Planning de diffusion
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Text mb={4}>En 2023, la transmission des listes s’effectuera en trois temps :</Text>
                      <Text mb={4}>
                        <UnorderedList>
                          <ListItem>
                            Mi-mai : une première campagne sera diffusée par courriel pour identifier les directeurs
                            d’organismes responsables, confirmer l’adresse email de réception, créer le mot de passe de
                            connexion (les mots de passe créés en 2022 ne seront pas utilisables).
                          </ListItem>
                          <ListItem>
                            Semaine du 5 juin : diffusion des listes de candidats sur l’adresse courriel confirmée.
                          </ListItem>
                          <ListItem>Semaine du 19 juin : diffusion des listes mises à jour.</ListItem>
                        </UnorderedList>
                      </Text>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </Box>
            </Alert>
          )}
        </Box>
      </Box>
    </Center>
  );
}

export default LoginPage;
