import React from "react";
import * as Yup from "yup";
import { Alert, Form as TablerForm, Card, Page, Button, Grid } from "tabler-react";
import { Formik, Field, Form } from "formik";
import { useHistory } from "react-router-dom";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import ErrorMessage from "../../common/components/ErrorMessage";
import CenteredCol from "../../common/components/CenteredCol";
import SuccessMessage from "../../common/components/SuccessMessage";

function ForgottenPasswordPage() {
  const [, setAuth] = useAuth();
  const history = useHistory();

  const showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {};
  };

  const resetPassword = async (values, { setStatus }) => {
    try {
      const { token } = await _post("/api/password/forgotten-password", { ...values });
      setAuth(token);
      setStatus({ message: "Un email vous a été envoyé." });
      setTimeout(() => history.push("/"), 1500);
    } catch (e) {
      console.error(e);
      setStatus({ error: "Identifiant invalide ou compte non activé." });
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
                  <Card.Title>Mot de passe oublié</Card.Title>
                </Card.Header>
                <Card.Body>
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
                          <TablerForm.Group label="Identifiant (siret)">
                            <Field name="username">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"text"}
                                    placeholder="Votre identifiant..."
                                    {...field}
                                    {...showError(meta)}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Demander un nouveau mot de passe
                          </Button>
                          {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
                          {status.message && <SuccessMessage>{status.message}</SuccessMessage>}
                        </Form>
                      );
                    }}
                  </Formik>
                </Card.Body>
              </Card>
            </CenteredCol>
          </Grid.Row>
          <Grid.Row>
            <CenteredCol>
              <Alert type={"info"}>
                <p>Le siret figure dans l'objet du mail que vous avez précédemment reçu.</p>
              </Alert>
            </CenteredCol>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default ForgottenPasswordPage;
