import { useEffect, useState } from "react";
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
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  ListItem,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import * as queryString from "query-string";

import { Yup } from "../common/Yup";
import { _post } from "../common/httpClient";
import { useQuery } from "../common/hooks/useQuery";
import useAuth from "../common/hooks/useAuth";
import { siretFormat } from "../common/utils/format";
import decodeJWT from "../common/utils/decodeJWT";
import { useFetch } from "../common/hooks/useFetch";
import { AlertMessage } from "../common/components/layout/AlertMessage";
import { EyeFill, EyeOffFill } from "../theme/components/icons";
import { USER_STATUS } from "../common/constants/UserStatus";

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
        message:
          "Si vous représentez un organisme responsable, vous devez indiquer un code SIRET valide. Si vous avez reçu une délégation pour l’accès aux candidatures, vous devez indiquer une adresse courriel valide et déclarée par l’organisme responsable.",
      });
    } else {
      const mailTo = `mailto:${mailVoeux}?subject=Problème de connexion (Identifiant ${username})`;
      return createError({
        path,
        message: (
          <Text>
            Cet identifiant ne correspond pas au code SIRET d'un organisme responsable enregistré comme tel dans
            Affelnet ni à celui d'un organisme formateur. Veuillez utiliser l'identifiant figurant dans nos précédents
            emails. En cas de difficulté, veuillez contacter le service support en indiquant votre identifiant à{" "}
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

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  const location = useLocation();
  const { actionToken, redirect } = queryString.parse(location.search);
  const username = decodeJWT(actionToken)?.sub || query.get("username");
  const [data, loading, error] = useFetch(`/api/login/status?username=${username}&token=${actionToken}`);

  console.log("LoginPage", { actionToken, redirect, data, loading, error });

  useEffect(() => {
    switch (data?.statut) {
      case USER_STATUS.EN_ATTENTE:
        navigate(`/confirmation?actionToken=${actionToken}&redirect=${encodeURIComponent(redirect)}`, {
          replace: true,
        });
        break;
      case USER_STATUS.CONFIRME:
        navigate(`/activation?actionToken=${actionToken}&redirect=${encodeURIComponent(redirect)}`, { replace: true });
        break;
      default:
        break;
    }
  }, [data?.statut, actionToken, navigate, redirect]);

  const login = async (values, { setStatus }) => {
    try {
      const { token } = await _post("/api/login", values);
      setAuth(token);
      navigate(redirect ?? "/");
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  const title = "Connexion";

  return (
    <Grid height="100vh" gridTemplateAreas={`'top' 'bottom'`} gridTemplateRows="max-content">
      <AlertMessage gridArea="top" />

      <Center gridArea="bottom" verticalAlign="center" flexDirection={"column"}>
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
              {({ values, status = {} }) => {
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
                                    <li>Organisme responsable : votre code Siret</li>
                                    <li>Personne déléguée: votre adresse courriel</li>
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
                                <InputGroup size="md">
                                  <Input
                                    {...field}
                                    id={field.name}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Votre mot de passe..."
                                  />

                                  <InputRightElement width="4.5rem">
                                    <Box onClick={toggleShowPassword}>
                                      {showPassword ? <EyeOffFill /> : <EyeFill />}
                                    </Box>
                                  </InputRightElement>
                                </InputGroup>
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
                      <Link to={`/forgotten-password?username=${values.username}`} as={NavLink} variant="action">
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
                {/* <Text mb={4}>
                  Le service de diffusion des candidatures sera accessible dans la semaine du 21 mai 2024 : un courriel
                  sera envoyé aux organismes responsables des offres pour leur permettre de confirmer l'adresse courriel
                  de la personne habilitée, et créer le mot de passe d'accès au service pour 2024.
                </Text>

                <Text mb={4}>
                  Les listes de candidatures seront ensuite diffusées entre la première semaine de juin. Les contacts
                  habilités en seront informés par courriel.
                </Text>

                <Text mb={4}>
                  En cas de mise à jour de ces listes, une deuxième et dernière version sera diffusée la dernière semaine de juin.
                </Text>

                <Text mb={4}>
                  L'expéditeur des différentes correspondance sera{" "}
                  <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                    {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                  </Link>
                  .
                </Text>

                <Text mb={4}>
                  Les destinataires seront les mêmes qu'en 2024 . Si vous pensez que les contacts peuvent avoir changé,
                  vous pouvez adresser un signalement à{" "}
                  <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                    {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                  </Link>
                  , en indiquant votre numéro Siret et code UAI.
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
                </Text> */}

                {/* <Text mb={4}>
                  Les listes de candidatures ont été rendues disponibles le mardi 4 juin 2024, puis ont été mises à
                  jour, selon les organismes, le 20 juin, le 24 juin ou le 27 juin. Des courriels ont été diffusés aux
                  contacts habilités : directeur·trices au sein des organismes responsables, ou personnes ayant reçu une
                  délégation de droit d’accès au sein des organismes formateurs.
                </Text>

                <Text mb={4}>Aucune autre mise à jour ne sera diffusée pour 2024.</Text>
                <Text mb={4}>
                  Si vous n’avez pas été destinataires de ces listes et que vous pensez qu’il s’agit d’une erreur :
                  <UnorderedList>
                    <ListItem>
                      {" "}
                      Veuillez vérifier dans vos spams, ou solliciter votre service informatique pour vérification.
                      L’émetteur du message est :{" "}
                      <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                        {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                      </Link>
                    </ListItem>
                    <ListItem>
                      {" "}
                      Après vérification des spams, vous pouvez faire un signalement en envoyant un message à{" "}
                      <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                        {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                      </Link>{" "}
                      en indiquant vos numéros Siret et UAI.
                    </ListItem>
                  </UnorderedList>
                </Text> */}

                <Text mb={4}>
                  <strong>
                    Les mots de passe utilisés en 2024 ne sont plus valables, de nouveaux comptes doivent être créés.
                    Des courriels vont être diffusés aux organismes de formation en apprentissage la dernière semaine de
                    mai, pour permettre de créer leur compte et définir leur mot de passe de connexion. Seuls les
                    organismes responsables des offres sont destinataires de ces premières correspondances.
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
                        <Text mb={4}>La transmission des listes s’effectuera en trois temps :</Text>
                        <Text mb={4}>
                          <UnorderedList>
                            <ListItem>
                              Dernière semaine de mai: une première campagne sera diffusée par courriel pour identifier
                              les directeurs d’organismes responsables, confirmer l’adresse email de réception, créer le
                              mot de passe de connexion (les mots de passe créés en 2024 ne seront pas utilisables).
                            </ListItem>
                            <ListItem>
                              Première semaine de juin: diffusion des listes de candidats sur l’adresse courriel
                              confirmée.
                            </ListItem>
                            <ListItem>Dernière semaine de juin: diffusion des listes mises à jour.</ListItem>
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
    </Grid>
  );
}

export default LoginPage;
