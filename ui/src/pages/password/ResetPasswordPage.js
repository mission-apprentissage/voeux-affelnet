import React from "react";
import queryString from "query-string";
import * as Yup from "yup";
import { Form as TablerForm, Card, Page, Button, Grid } from "tabler-react";
import { Formik, Field, Form } from "formik";
import { useHistory, useLocation } from "react-router-dom";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import decodeJWT from "../../common/utils/decodeJWT";
import ErrorMessage from "../../common/components/ErrorMessage";
import CenteredCol from "../../common/components/CenteredCol";

function ResetPasswordPage() {
  const [, setAuth] = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { resetPasswordToken } = queryString.parse(location.search);
  const uai = decodeJWT(resetPasswordToken).sub;

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
      history.push("/");
    } catch (e) {
      console.error(e);
      setStatus({
        error: (
          <span>
            Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
            mail de réception des voeux ou votre numéro UAI via :
            <br />
            <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
          </span>
        ),
      });
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
                  <Card.Title>Changement du mot de passe pour le CFA {uai}</Card.Title>
                </Card.Header>
                <Card.Body>
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
                          <TablerForm.Group label="Nouveau mot de passe">
                            <Field name="newPassword">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"password"}
                                    placeholder="Votre mot de passe..."
                                    {...field}
                                    {...showError(meta)}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Réinitialiser le mot de passe
                          </Button>
                          {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
                        </Form>
                      );
                    }}
                  </Formik>
                </Card.Body>
              </Card>
            </CenteredCol>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default ResetPasswordPage;
