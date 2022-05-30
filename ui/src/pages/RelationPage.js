import React, { useState } from "react";
import * as Yup from "yup";
import { Card, Grid, Page, Table, Form as TablerForm, Button } from "tabler-react";
import { Formik, Field, Form } from "formik";

import { _get } from "../common/httpClient";
import ErrorMessage from "../common/components/ErrorMessage";
import { asTablerInputError } from "../common/utils/tablerReactUtils";

function RelationPage() {
  const { gestionnaireOpened, setGestionnaireOpened } = useState(false);
  const { formateurOpened, setFormateurOpened } = useState(false);

  const [gestionnaireData, setGestionnaireData] = useState(undefined);
  const [gestionnaireError, setGestionnaireError] = useState(undefined);
  const [formateurData, setFormateurData] = useState(undefined);
  const [formateurError, setFormateurError] = useState(undefined);

  const submitGestionnaireSearch = async (value) => {
    try {
      setGestionnaireError(undefined);
      const data = await _get(`/api/relation/rechercheGestionnaire?search=${value.search}`);
      setGestionnaireData(data.results);
    } catch (e) {
      console.error(e);
      setGestionnaireData(undefined);
      setGestionnaireError(e);
    }
  };

  const submitFormateurSearch = async (value) => {
    try {
      setFormateurError(undefined);
      const data = await _get(`/api/relation/rechercheFormateur?search=${value.search}`);
      setFormateurData(data.results);
    } catch (e) {
      console.error(e);
      setFormateurData(undefined);
      setFormateurError(e);
    }
  };

  return (
    <Page>
      <Page.Main>
        <Page.Content title="">
          <Grid.Row>
            <Grid.Col width={12}>
              <Card>
                <Card.Header>
                  <Card.Title>
                    {" "}
                    1/ vous êtes un établissement responsable (signataire des conventions de formation) et vous
                    souhaitez savoir pour quelles UAI d’accueil vous allez recevoir la liste des vœux exprimés sur le
                    service en ligne Affelnet ?{" "}
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      search: "",
                    }}
                    validationSchema={Yup.object().shape({
                      search: Yup.string().required("Requis"),
                    })}
                    onSubmit={submitGestionnaireSearch}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group>
                            <Field name="search">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"text"}
<<<<<<< HEAD
                                    placeholder="Rechercher un siret, une raison sociale du responsable"
=======
                                    placeholder="Rechercher un siret, une raison sociale, un UAI du responsable"
>>>>>>> 627720d975506d6139a82dc8c0633c19d2cb252b
                                    {...field}
                                    {...asTablerInputError(meta)}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Rechercher
                          </Button>

                          {gestionnaireError && <ErrorMessage>{gestionnaireError.message}</ErrorMessage>}
                        </Form>
                      );
                    }}
                  </Formik>

                  {gestionnaireData &&
                    gestionnaireData.map((result, index) => (
                      <React.Fragment key={index}>
                        <br />
                        <br />
                        Organisme responsable trouvé : {result.gestionnaire.siret}
                        <br />
                        <br />
                        Cet organisme recevra les vœux exprimés pour les établissements d'accueil suivants :
                        <Table>
                          <Table.Header>
                            <Table.Row>
                              <Table.ColHeader>UAI</Table.ColHeader>
                              <Table.ColHeader>LIBELLE_TYPE_ETABLISSEMENT</Table.ColHeader>
                              <Table.ColHeader>LIBELLE_ETABLISSEMENT</Table.ColHeader>
                              <Table.ColHeader>ADRESSE</Table.ColHeader>
                              <Table.ColHeader>CP</Table.ColHeader>
                              <Table.ColHeader>COMMUNE</Table.ColHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {result.formateurs?.map((formateur, index) => {
                              return (
                                <Table.Row key={index}>
                                  <Table.Col>{formateur.uai}</Table.Col>
                                  <Table.Col>{formateur.libelle_type_etablissement}</Table.Col>
                                  <Table.Col>{formateur.libelle_etablissement}</Table.Col>
                                  <Table.Col>{formateur.adresse}</Table.Col>
                                  <Table.Col>{formateur.cp}</Table.Col>
                                  <Table.Col>{formateur.commune}</Table.Col>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table>
                      </React.Fragment>
                    ))}

                  {/* TODO :
                    Si Siret non trouvé :
                    [message à rédiger + tard] */}
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>

          <Grid.Row>
            <Grid.Col width={12}>
              <Card>
                <Card.Header>
                  <Card.Title>
                    {" "}
                    2/ vous êtes un établissement d’accueil et vous souhaitez savoir quel organisme responsable va
                    recevoir la liste des vœux exprimés sur le service en ligne Affelnet ?{" "}
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      search: "",
                    }}
                    validationSchema={Yup.object().shape({
                      search: Yup.string().required("Requis"),
                    })}
                    onSubmit={submitFormateurSearch}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group>
                            <Field name="search">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"text"}
                                    placeholder="Rechercher un UAI, un libellé établissement (tel que figurant sur Affelnet)"
                                    {...field}
                                    {...asTablerInputError(meta)}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Rechercher
                          </Button>

                          {formateurError && <ErrorMessage>{formateurError.message}</ErrorMessage>}
                        </Form>
                      );
                    }}
                  </Formik>

                  {formateurData &&
                    formateurData.map((result, index) => (
                      <React.Fragment key={index}>
                        <br />
                        <br />
                        Etablissement d'accueil trouvé : {result.formateur.uai}
                        <br />
                        <br />
                        Cet établissement d'accueil devra contacter l'organisme gestionnaire suivant afin de récupérer
                        la liste des vœux exprimés :
                        <Table>
                          <Table.Header>
                            <Table.Row>
                              <Table.ColHeader>SIRET</Table.ColHeader>
                              <Table.ColHeader>UAI</Table.ColHeader>
                              <Table.ColHeader>RAISON SOCIALE</Table.ColHeader>
                              <Table.ColHeader>ADRESSE</Table.ColHeader>

                              <Table.ColHeader>MAIL</Table.ColHeader>
                              <Table.ColHeader>STATUT</Table.ColHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            <Table.Row>
                              <Table.Col>{result.gestionnaire.siret}</Table.Col>
                              <Table.Col>{result.gestionnaire.uai}</Table.Col>
                              <Table.Col>{result.gestionnaire.raison_sociale}</Table.Col>
                              <Table.Col>{result.gestionnaire.adresse.label}</Table.Col>

                              <Table.Col>{result.gestionnaire.email}</Table.Col>
                              <Table.Col>{result.gestionnaire.statut}</Table.Col>
                            </Table.Row>
                          </Table.Body>
                        </Table>
                      </React.Fragment>
                    ))}

                  {/* TODO :
                    Si on pouvait avoir un second encart dans lequel on indique à ce moment-là et selon le cas :

                    1/ Cet UAI n’est pas référencé sur le service en ligne Affelnet pour la campagne 2022, n’hésitez pas à vous rapprocher de votre Carif-Oref pour déclarer votre offre de formation
                    2/ À ce stade aucun vœu n’a été exprimé pour cet établissement d'accueil. La transmission de listes de vœux s’effectuera en 3 temps : dans la semaine du 6 juin, dans la semaine du 20 juin et dans la semaine du 4 juillet. M, merci pour votre patience
                    3/ Des vœux ont été téléchargés pour votre UAI établissement d'accueil par l’organisme  responsable (Siret : {Siret}), le {JJ/MM/AAAA}.
                    C’est l’établissement responsable qui est chargé de vous transmettre la liste correspondant à votre établissement. Vous pouvez vous rapprocher de votre établissement responsable pour vous assurer que la liste vous sera bien transmise dans les meilleurs délais. nous vous invitons à le contacter afin que cette liste puisse vous être transmise
                    4/ Des vœux sont disponibles pour téléchargement par l’établissement responsable (Siret : {Siret}), depuis le JJ/MM/AAAA. Vous pouvez vous rapprocher de votre établissement responsable pour vous assurer que la liste vous sera bien transmise dans les meilleurs délaisun délai raisonnable., nous vous invitons à le contacter afin qu’il puisse entamer les démarches nécessaires (confirmation mail et activation de compte) et que cette liste puisse vous être transmise */}
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}

export default RelationPage;
