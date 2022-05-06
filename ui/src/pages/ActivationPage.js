import React, { useState } from "react";
import queryString from "query-string";
import * as Yup from "yup";
import { Alert, Button, Card, Form as TablerForm, Grid, Page } from "tabler-react";
import { Field, Form, Formik } from "formik";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import useAuth from "../common/hooks/useAuth";
import { _post } from "../common/httpClient";
import decodeJWT from "../common/utils/decodeJWT";
import { asTablerInputError } from "../common/utils/tablerReactUtils";
import MiddleCenteredCol from "../common/components/MiddleCenteredCol";
import ErrorMessage from "../common/components/ErrorMessage";
import { useFetch } from "../common/hooks/useFetch";

function StatusErrorMessage({ error, username }) {
  const history = useHistory();

  if (error.statusCode === 401) {
    return (
      <Alert type={"danger"}>
        <p>
          Ce lien est expiré ou invalide, merci de prendre contact avec un administrateur votre identifiant ({username})
          via :&nbsp;
          <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
        </p>
      </Alert>
    );
  } else if (error.statusCode === 400) {
    history.push(`/login?alreadyActivated=true&username=${username}`);
  }
  return <div />;
}

function ActivationPage() {
  const [, setAuth] = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { actionToken } = queryString.parse(location.search);
  const [message, setMessage] = useState();
  const username = decodeJWT(actionToken).sub;
  const [, loading, error] = useFetch(`/api/activation/status?username=${username}&token=${actionToken}`);

  const activation = async (values) => {
    try {
      const { token } = await _post("/api/activation", { ...values, actionToken });
      setAuth(token);
      history.push("/");
    } catch (e) {
      console.error(e);

      setMessage(<StatusErrorMessage error={e} username={username} />);
    }
  };

  const showForm = !loading && !message && !error;

  return (
    <Page>
      <Page.Main>
        <Page.Content title="Voeux Affelnet">
          <Grid.Row>
            <MiddleCenteredCol>
              {error && <StatusErrorMessage error={error} username={username} />}
              {loading && <div>En cours de chargement...</div>}
              {showForm ? (
                <Card>
                  <Card.Header>
                    <Card.Title>Activation de votre compte {username}</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <p>
                      Afin d’accéder au service de téléchargement des voeux en apprentissage exprimés via AFFELNET, nous
                      vous prions d'activer votre compte en créant un mot de passe.
                    </p>
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
                            <TablerForm.Group label="Mot de passe">
                              <Field name="password">
                                {({ field, meta }) => {
                                  return (
                                    <TablerForm.Input
                                      type={"password"}
                                      placeholder="Votre mot de passe..."
                                      {...field}
                                      {...asTablerInputError(meta)}
                                    />
                                  );
                                }}
                              </Field>
                            </TablerForm.Group>
                            <Button color="primary" className="text-left" type={"submit"}>
                              Activer le compte
                            </Button>
                            {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
                          </Form>
                        );
                      }}
                    </Formik>
                  </Card.Body>
                </Card>
              ) : (
                <div />
              )}
            </MiddleCenteredCol>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default ActivationPage;
