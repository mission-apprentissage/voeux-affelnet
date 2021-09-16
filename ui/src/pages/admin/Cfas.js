import React, { useEffect, useState } from "react";
import { Button, Dropdown, Card, Form as TablerForm, Grid, Table, Icon } from "tabler-react";
import Pagination from "../../common/components/Pagination";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import SuccessMessage from "../../common/components/SuccessMessage";
import ErrorMessage from "../../common/components/ErrorMessage";
import { _get, _put } from "../../common/httpClient";
import * as queryString from "query-string";

function showError(meta, options = {}) {
  if (!meta.touched || !meta.error) {
    return {};
  }

  return {
    ...(options.noMessage ? {} : { feedback: meta.error }),
    invalid: true,
  };
}

function Email({ cfa }) {
  let { uai, email, statut, voeux_date } = cfa;
  let [edit, setEdit] = useState(false);
  let [message, setMessage] = useState();

  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 2500);
    }
  }, [message]);

  async function setEmail(values, actions) {
    try {
      await _put(`/api/admin/cfas/${uai}/setEmail`, { email: values.email });
      setEdit(false);
    } catch (e) {
      console.error(e);
      actions.setStatus({ error: "Une erreur est survenue" });
    }
  }

  async function resendConfirmationEmail() {
    try {
      let { sent } = await _put(`/api/admin/cfas/${uai}/resendConfirmationEmail`);
      setMessage(
        sent > 0 ? (
          <SuccessMessage>Email envoyé</SuccessMessage>
        ) : (
          <ErrorMessage>Impossible d'envoyer le message</ErrorMessage>
        )
      );
    } catch (e) {
      console.error(e);
    }
    return true;
  }

  async function resendActivationEmail() {
    try {
      let { sent } = await _put(`/api/admin/cfas/${uai}/resendActivationEmail`);
      setMessage(
        sent > 0 ? (
          <SuccessMessage>Email envoyé</SuccessMessage>
        ) : (
          <ErrorMessage>Impossible d'envoyer le message</ErrorMessage>
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  let items = [
    {
      icon: "edit",
      value: "Modifier l'email",
      onClick: () => setEdit(true),
    },
    ...(statut === "en attente"
      ? [
          {
            icon: "send",
            value: "Renvoyer l'email de confirmation",
            onClick: resendConfirmationEmail,
          },
        ]
      : []),
    ...(statut === "confirmé" && voeux_date
      ? [
          {
            icon: "send",
            value: "Renvoyer l'email d'activation",
            onClick: resendActivationEmail,
          },
        ]
      : []),
  ];

  return (
    <Formik
      initialValues={{
        email,
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email(),
      })}
      onSubmit={setEmail}
    >
      {({ status = {} }) => {
        return (
          <Form>
            <Field name="email">
              {({ field, meta }) => {
                return (
                  <TablerForm.InputGroup>
                    <TablerForm.Input disabled={!edit} {...field} {...showError(meta, { noMessage: true })} />
                    <TablerForm.InputGroupAppend>
                      {edit ? (
                        <>
                          <Button color="success" type={"submit"}>
                            <Icon name="check" />
                          </Button>
                          <Button color="danger" onClick={() => setEdit(false)}>
                            <Icon name="x" />
                          </Button>
                        </>
                      ) : (
                        <Dropdown type="button" toggle={false} icon="settings" itemsObject={items} />
                      )}
                    </TablerForm.InputGroupAppend>
                  </TablerForm.InputGroup>
                );
              }}
            </Field>
            {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
            {message}
          </Form>
        );
      }}
    </Formik>
  );
}

function Statut({ cfa }) {
  let { uai } = cfa;
  let [statut, setStatut] = useState(cfa.statut);
  let [message, setMessage] = useState();

  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 2500);
    }
  }, [message]);

  async function markAsNonConcerné() {
    try {
      let { statut } = await _put(`/api/admin/cfas/${uai}/markAsNonConcerne`);
      setMessage(<SuccessMessage>L'établissement est désormais non concerné</SuccessMessage>);
      setStatut(statut);
    } catch (e) {
      console.error(e);
      setMessage(<ErrorMessage>Impossible de changer le statut de l'établissement</ErrorMessage>);
    }
  }

  let items =
    statut !== "non concerné"
      ? [
          {
            icon: "slash",
            value: "Non concerné",
            onClick: markAsNonConcerné,
          },
        ]
      : [
          {
            value: "Pas d'actions disponibles",
          },
        ];

  return (
    <>
      <TablerForm.InputGroup>
        <TablerForm.Input disabled={true} value={statut} />
        <TablerForm.InputGroupAppend>
          <Dropdown type="button" toggle={false} icon="settings" itemsObject={items} />
        </TablerForm.InputGroupAppend>
      </TablerForm.InputGroup>
      {message}
    </>
  );
}

function Cfas() {
  let [error, setError] = useState();
  let [loading, setLoading] = useState();
  let [query, setQuery] = useState();
  let [data, setData] = useState({
    cfas: [],
    pagination: {
      page: 0,
      items_par_page: 0,
      nombre_de_page: 0,
      total: 0,
    },
  });

  async function search(values) {
    try {
      setQuery(values);
      let params = queryString.stringify(values, { skipNull: true, skipEmptyString: true });
      let data = await _get(`/api/admin/cfas${params ? `?${params}` : ""}`);
      setLoading(false);
      setData(data);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(e);
    }
  }

  useEffect(() => {
    async function runAsync() {
      return search();
    }
    runAsync();
  }, []);

  return (
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Card.Header>
            <Card.Title>CFA</Card.Title>
          </Card.Header>
          <Card.Body>
            <Formik
              initialValues={{
                text: "",
              }}
              validationSchema={Yup.object().shape({
                text: Yup.string(),
              })}
              onSubmit={(values) => search({ page: 1, ...values })}
            >
              {({ status = {} }) => {
                return (
                  <Form>
                    <TablerForm.InputGroup
                      append={
                        <Button color="primary" className="text-left" type={"submit"}>
                          Rechercher
                        </Button>
                      }
                    >
                      <Field name="text">
                        {({ field, meta }) => {
                          return (
                            <TablerForm.Input
                              placeholder={"Rechercher un uai, siret, raison sociale, académie, email, statut"}
                              {...field}
                              {...showError(meta)}
                            />
                          );
                        }}
                      </Field>
                    </TablerForm.InputGroup>

                    {status.message && <SuccessMessage>{status.message}</SuccessMessage>}
                    {error && <ErrorMessage>Une erreur est survenue</ErrorMessage>}
                  </Form>
                );
              }}
            </Formik>
            <Table style={{ marginTop: "15px" }}>
              <Table.Header>
                <Table.Row>
                  <Table.ColHeader>UAI</Table.ColHeader>
                  <Table.ColHeader>Statut</Table.ColHeader>
                  <Table.ColHeader>Email</Table.ColHeader>
                  <Table.ColHeader>Voeux</Table.ColHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {loading || data.cfas.length === 0 ? (
                  <Table.Row>
                    <Table.Col colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Table.Col>
                  </Table.Row>
                ) : (
                  data.cfas.map((cfa) => {
                    return (
                      <Table.Row key={cfa.uai}>
                        <Table.Col>{cfa.uai}</Table.Col>
                        <Table.Col>
                          <Statut cfa={cfa} />
                        </Table.Col>
                        <Table.Col>
                          <Email cfa={cfa} />
                        </Table.Col>
                        <Table.Col>
                          {cfa.voeux_date
                            ? cfa.voeux_telechargements[0]
                              ? "Voeux téléchargés"
                              : "Pas encore téléchargé"
                            : "Pas de voeux"}
                        </Table.Col>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table>
            <Pagination pagination={data.pagination} onClick={(page) => search({ ...query, page })} />
          </Card.Body>
        </Card>
      </Grid.Col>
    </Grid.Row>
  );
}

export default Cfas;
