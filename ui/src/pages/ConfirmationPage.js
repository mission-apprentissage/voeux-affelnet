import React, { useState } from "react";
import queryString from "query-string";
import * as Yup from "yup";
import { Alert, Button, Card, Form as TablerForm, Grid, Page } from "tabler-react";
import { Field, Form, Formik } from "formik";
import { useLocation } from "react-router-dom";
import { _post } from "../common/httpClient";
import decodeJWT from "../common/utils/decodeJWT";
import MiddleCenteredCol from "../common/components/MiddleCenteredCol";
import ErrorMessage from "../common/components/ErrorMessage";
import { useFetch } from "../common/hooks/useFetch";
import { asTablerInputError } from "../common/utils/tablerReactUtils";

function ServerErrorMessage() {
  return (
    <Alert type="danger">
      Une erreur est survenue, merci de prendre contact avec un administrateur en précisant votre numéro UAI via :
      <br />
      <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
    </Alert>
  );
}

function StatusErrorMessage({ error, uai }) {
  if (error) {
    if (error.statusCode === 401) {
      return (
        <Alert type={"danger"}>
          <p>
            Ce lien est expiré ou invalide, merci de prendre contact avec un administrateur votre numéro UAI ({uai}) via
            :&nbsp;
            <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
          </p>
        </Alert>
      );
    } else if (error.statusCode === 400) {
      return (
        <Alert type={"info"}>
          <p>Une personne de votre structure a déjà confirmé une adresse email.</p>
          <p>
            Un email vous permettant d'activer votre compte vous sera envoyé à cette adresse à reception de voeux pour
            votre établissement {uai}
          </p>
          <p>
            Pour plus d'informations, merci de prendre contact avec un administrateur en précisant votre numéro UAI (
            {uai}) via :&nbsp;
            <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
          </p>
        </Alert>
      );
    }
  }

  return <div />;
}

function ConfirmationPage() {
  const location = useLocation();
  const { actionToken } = queryString.parse(location.search);
  const uai = decodeJWT(actionToken).sub;
  const [data, loading, statusError] = useFetch(`/api/confirmation/status?uai=${uai}&token=${actionToken}`);
  const [message, setMessage] = useState();

  const accept = async (values) => {
    try {
      await _post("/api/confirmation/accept", { ...values, actionToken });
      setMessage(
        <Alert type="info">
          <p>Merci, nous avons pris en compte votre confirmation</p>
          <p>
            Un email vous permettant d'activer votre compte vous sera envoyé à cette adresse à reception de voeux pour
            votre établissement {uai}
          </p>
        </Alert>
      );
    } catch (e) {
      console.error(e);
      setMessage(<ServerErrorMessage />);
    }
  };

  const showForm = !loading && !message && data;

  return (
    <Page>
      <Page.Main>
        <Page.Content title="Voeux Affelnet">
          <Grid.Row>
            <MiddleCenteredCol>
              <StatusErrorMessage error={statusError} uai={uai} />
              {message}
              {loading && <div>En cours de chargement...</div>}
              {showForm && (
                <Card>
                  <Card.Header>
                    <Card.Title>
                      Confirmation de l'email pour le compte <strong>{uai}</strong>
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Formik
                      initialValues={{
                        email: data.email,
                      }}
                      validationSchema={Yup.object().shape({
                        email: Yup.string().email().required(),
                      })}
                      onSubmit={accept}
                    >
                      {({ status = {} }) => {
                        return (
                          <Form>
                            <p>
                              Afin d’accéder au service de téléchargement des voeux en apprentissage exprimés via
                              AFFELNET, merci de confirmer l’adresse email qui correspond à la
                              <strong> direction</strong> de votre établissement à laquelle les vœux formulés pourront
                              être transmis
                            </p>
                            <TablerForm.Group label="Email">
                              <Field name="email">
                                {({ field, meta }) => {
                                  return (
                                    <TablerForm.Input
                                      type={"email"}
                                      placeholder="Nouvelle adresse email..."
                                      {...field}
                                      {...asTablerInputError(meta)}
                                    />
                                  );
                                }}
                              </Field>
                            </TablerForm.Group>
                            <Button color="primary" className="text-left" type={"submit"}>
                              Confirmer l'email pour l'établissement {uai}
                            </Button>
                            {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
                          </Form>
                        );
                      }}
                    </Formik>
                  </Card.Body>
                </Card>
              )}
            </MiddleCenteredCol>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default ConfirmationPage;
