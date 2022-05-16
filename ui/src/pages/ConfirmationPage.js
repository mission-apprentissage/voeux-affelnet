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
      Une erreur est survenue, merci de prendre contact avec un administrateur en précisant votre siret via :
      <br />
      <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
    </Alert>
  );
}

function StatusErrorMessage({ error, username }) {
  if (error) {
    if (error.statusCode === 401) {
      return (
        <Alert type={"danger"}>
          <p>
            Ce lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre numéro
            Siret ({username}) via : :&nbsp;
            <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
          </p>
        </Alert>
      );
    } else if (error.statusCode === 400) {
      return (
        <Alert type={"info"}>
          <p>L’adresse courriel a déjà été confirmée pour votre établissement (Siret {username})</p>
          <p>C’est à cette adresse que les listes de vœux seront transmises, à partir de la semaine du 6 juin.</p>
          <p>
            Si vous pensez qu’il s’agit d’une erreur, veuillez le signaler en envoyant un courriel à :&nbsp;
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
  const username = decodeJWT(actionToken).sub;
  const [data, loading, statusError] = useFetch(`/api/confirmation/status?username=${username}&token=${actionToken}`);
  const [message, setMessage] = useState();

  const accept = async (values) => {
    try {
      await _post("/api/confirmation/accept", { ...values, actionToken });
      setMessage(
        <Alert type="info">
          <p>Merci, nous avons pris en compte votre confirmation</p>
          <p>
            La transmission de listes de vœux s’effectuera en 3 temps : dans la semaine du 6 juin, dans la semaine du 20
            juin et dans la semaine du 4 juillet. Des courriels seront envoyés à chacune de ces dates à l’adresse
            indiquée, uniquement si des vœux sont exprimés sur votre établissement et/ou l’un des établissements dont
            vous avez la charge.
          </p>
          <p>Le premier courriel invitera à définir un mot de passe pour accès à l’espace de téléchargement.</p>
          <p>
            Si votre établissement est responsable d’autres établissements d’accueil, la connexion au compte permettra
            de télécharger les listes pour chaque établissement sur lequel des vœux ont été exprimés.
          </p>
          <p>
            Pour toute question, vous pouvez prendre contact contact avec un administrateur en précisant votre numéro
            Siret ({username}) via :
            <a href="mailto:voeux-affelnet@apprentissage.beta.gouv.fr">voeux-affelnet@apprentissage.beta.gouv.fr</a>
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
              <StatusErrorMessage error={statusError} username={username} />
              {message}
              {loading && <div>En cours de chargement...</div>}
              {showForm && (
                <Card>
                  <Card.Header>
                    <Card.Title>
                      Confirmation de l'email pour le compte <strong>{username}</strong>
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
                              Afin d’accéder au téléchargement des vœux en apprentissage exprimés via Affelnet, veuillez
                              confirmer l’adresse courriel du directeur général de votre établissement (Siret:{" "}
                              {username})
                            </p>
                            <p>
                              Cette étape est indispensable pour vous permettre de recevoir les listes de vœux qui
                              seront diffusées à partir de la semaine du 6 juin.
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
                              Confirmer l'email pour l'établissement {username}
                            </Button>
                            <p className={"mt-4"}>
                              <i>
                                L’
                                <a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000035274717/2020-11-09/">
                                  arrêté du 17 juillet 2017
                                </a>
                                , au 7e alinéa de l’article 4, précise que seuls les directeurs des centres de formation
                                d'apprentis sont habilités à recevoir les données transmises mentionnées à l’article 3
                                de ce même arrêté.
                              </i>
                            </p>
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
