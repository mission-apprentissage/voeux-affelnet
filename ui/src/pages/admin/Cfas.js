import React, { useEffect, useState } from "react";
import { Button, Dropdown, Card, Form as TablerForm, Grid, Table, Icon } from "tabler-react";
import { Pagination } from "../../common/components/Pagination";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import SuccessMessage from "../../common/components/SuccessMessage";
import ErrorMessage from "../../common/components/ErrorMessage";
import { _get, _put } from "../../common/httpClient";
import * as queryString from "query-string";
import Popup from "reactjs-popup";

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
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState();

  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 2500);
    }
  }, [message]);

  async function setEmail(values, actions) {
    try {
      await _put(`/api/admin/cfas/${cfa.siret}/setEmail`, { email: values.email });
      setEdit(false);
    } catch (e) {
      console.error(e);
      actions.setStatus({ error: "Une erreur est survenue" });
    }
  }

  async function resendConfirmationEmail() {
    try {
      const { sent } = await _put(`/api/admin/cfas/${cfa.siret}/resendConfirmationEmail`);
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
      const { sent } = await _put(`/api/admin/cfas/${cfa.siret}/resendActivationEmail`);
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

  const items = [
    {
      icon: "edit",
      value: "Modifier l'email",
      onClick: () => setEdit(true),
    },
    ...(cfa.statut === "en attente"
      ? [
          {
            icon: "send",
            value: "Renvoyer l'email de confirmation",
            onClick: resendConfirmationEmail,
          },
        ]
      : []),
    ...(cfa.statut === "confirmé" && cfa.etablissements.find((e) => e.voeux_date)
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
        email: cfa.email,
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
  const [statut, setStatut] = useState(cfa.statut);
  const [message, setMessage] = useState();

  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 2500);
    }
  }, [message]);

  async function markAsNonConcerné() {
    try {
      const { statut } = await _put(`/api/admin/cfas/${cfa.siret}/markAsNonConcerne`);
      setMessage(<SuccessMessage>L'établissement est désormais non concerné</SuccessMessage>);
      setStatut(statut);
    } catch (e) {
      console.error(e);
      setMessage(<ErrorMessage>Impossible de changer le statut de l'établissement</ErrorMessage>);
    }
  }

  const items =
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

function Cfa({ cfa }) {
  return (
    <Card title={`CFA ${cfa.siret}`}>
      <ul style={{ margin: "16px", listStyle: "none", paddingInlineStart: 0, maxWidth: "80vw" }}>
        <li>
          <b>Siret: </b> {cfa.siret}
        </li>
        <li>
          <b>Statut: </b> {cfa.statut}
        </li>
        <li>
          <b>Email: </b> {cfa.email}
        </li>
        <li>
          <b>Voeux: </b>{" "}
          {cfa.etablissements?.find((e) => e.voeux_date)
            ? cfa.voeux_telechargements[0]
              ? "Voeux téléchargés"
              : "Pas encore téléchargé"
            : "Pas de voeux"}
        </li>
        <li>
          <b>Anciens emails: </b> {cfa.anciens_emails?.map((ancien_email) => ancien_email.email).join(", ")}
        </li>
        <li>
          <b>Etablissements: </b> {cfa.etablissements?.map((e) => e.uai).join(", ")}
        </li>
      </ul>
    </Card>
  );
}

function Cfas() {
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const [query, setQuery] = useState();
  const [data, setData] = useState({
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
      const params = queryString.stringify(values, { skipNull: true, skipEmptyString: true });
      const data = await _get(`/api/admin/cfas${params ? `?${params}` : ""}`);
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
                              placeholder={"Rechercher un siret, raison sociale, académie, email, statut"}
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
                  <Table.ColHeader>Siret</Table.ColHeader>
                  <Table.ColHeader>Statut</Table.ColHeader>
                  <Table.ColHeader>Email</Table.ColHeader>
                  <Table.ColHeader>Voeux</Table.ColHeader>
                  <Table.ColHeader></Table.ColHeader>
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
                      <Table.Row key={cfa.siret}>
                        <Table.Col>{cfa.siret}</Table.Col>
                        <Table.Col>
                          <Statut cfa={cfa} />
                        </Table.Col>
                        <Table.Col>
                          <Email cfa={cfa} />
                        </Table.Col>
                        <Table.Col>
                          {cfa.etablissements.find((e) => e.voeux_date)
                            ? cfa.voeux_telechargements[0]
                              ? "Voeux téléchargés"
                              : "Pas encore téléchargé"
                            : "Pas de voeux"}
                        </Table.Col>
                        <Table.Col>
                          <Popup trigger={<Button size="sm">Voir le détail</Button>} modal nested>
                            <Cfa cfa={cfa} />
                          </Popup>
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
