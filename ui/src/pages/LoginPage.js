import React from "react";
import * as Yup from "yup";
import { Alert, Form as TablerForm, Card, Page, Button, Grid } from "tabler-react";
import { Formik, Field, Form } from "formik";
import { NavLink, useHistory } from "react-router-dom";
import { useQuery } from "../common/hooks/useQuery";
import useAuth from "../common/hooks/useAuth";
import { _post } from "../common/httpClient";
import CenteredCol from "../common/components/CenteredCol";
import ErrorMessage from "../common/components/ErrorMessage";

function LoginPage() {
  const [, setAuth] = useAuth();
  const history = useHistory();
  const query = useQuery();
  const username = query.get("username");
  const alreadyActivated = query.get("alreadyActivated");

  const feedback = (meta, message) => {
    return meta.touched && meta.error
      ? {
          feedback: message,
          invalid: true,
        }
      : {};
  };

  const login = async (values, { setStatus }) => {
    try {
      const { token } = await _post("/api/login", values);
      setAuth(token);
      history.push("/");
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Grid.Row>
            <CenteredCol>
              <Card>
                <Card.Header>
                  <Card.Title>Connexion</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      username: username ?? "",
                      password: "",
                    }}
                    validationSchema={Yup.object().shape({
                      username: Yup.string().required("Requis"),
                      password: Yup.string().required("Requis"),
                    })}
                    onSubmit={login}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group label="Identifiant">
                            <Field name="username">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    placeholder="Votre identifiant (UAI)..."
                                    {...field}
                                    {...feedback(meta, "Identifiant invalide")}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <TablerForm.Group label="Mot de passe">
                            <Field name="password">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"password"}
                                    placeholder="Votre mot de passe..."
                                    {...field}
                                    {...feedback(meta, "Mot de passe invalide")}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <div className={"d-flex justify-content-between align-items-center"}>
                            <Button color="primary" className="text-left" type={"submit"}>
                              Connexion
                            </Button>
                            <NavLink to="/forgotten-password">Mot de passe oublié</NavLink>
                          </div>

                          {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
                        </Form>
                      );
                    }}
                  </Formik>
                </Card.Body>
              </Card>
            </CenteredCol>
          </Grid.Row>

          {alreadyActivated && (
            <Grid.Row>
              <CenteredCol>
                <Alert type={"info"}>
                  <p>
                    Besoin d'aide ? Prenez contact avec un administrateur à l'adresse mail{" "}
                    <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">
                      voeux-affelnet@apprentissage.beta.gouv.fr
                    </a>{" "}
                    en précisant votre siret ({username})
                  </p>
                </Alert>
              </CenteredCol>
            </Grid.Row>
          )}
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default LoginPage;
