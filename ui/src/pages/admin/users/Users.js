import React, { useEffect, useState } from "react";
import { Box, Button, Text, Input, Table, Tbody, Td, Thead, Th, Tr, Link, Select, Tag } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import * as queryString from "query-string";

import { Pagination } from "../../../common/components/Pagination";
import SuccessMessage from "../../../common/components/SuccessMessage";
import ErrorMessage from "../../../common/components/ErrorMessage";
import { Yup } from "../../../common/Yup";
import { _get } from "../../../common/httpClient";
import { GestionnaireLibelle } from "../../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { GestionnaireStatut } from "../../../common/components/admin/fields/GestionnaireStatut";

// const iconProps = {
//   width: "16px",
//   height: "16px",
//   margin: "auto",
//   marginTop: "2px",
//   display: "flex",
// };

// function getStatutVoeux(gestionnaire) {
//   let statut;

//   switch (true) {
//     case !gestionnaire.etablissements?.find((e) => e.voeux_date):
//       statut = "Pas de voeux";
//       break;
//     case !!gestionnaire.etablissements?.find((e) => e.voeux_date) && !gestionnaire.voeux_telechargements?.length:
//       statut = "Pas encore téléchargés";
//       break;

//     case !!gestionnaire.etablissements?.find((e) => e.voeux_date) &&
//       !!gestionnaire.etablissements?.find(
//         (etablissement) =>
//           etablissement?.voeux_date &&
//           !gestionnaire?.voeux_telechargements
//             ?.sort((a, b) => sortDescending(a.date, b.date))
//             .find((v) => etablissement?.uai === v.uai && v.date > etablissement?.voeux_date)
//       ):
//       statut = "En partie téléchargés";
//       break;
//     case !!gestionnaire.etablissements?.find((e) => e.voeux_date) &&
//       !gestionnaire.etablissements?.find(
//         (etablissement) =>
//           etablissement?.voeux_date &&
//           !gestionnaire?.voeux_telechargements
//             ?.sort((a, b) => sortDescending(a.date, b.date))
//             .find((v) => etablissement?.uai === v.uai && v.date > etablissement?.voeux_date)
//       ):
//       statut = "Téléchargés";
//       break;
//     default:
//       statut = "Inconnu";
//       break;
//   }
//   return statut;
// }

export const Users = () => {
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const [query, setQuery] = useState();
  const [data, setData] = useState({
    users: [],
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
      const params = queryString.stringify(
        { ...values, sort: JSON.stringify({ type: -1, nombre_voeux: -1 }) },
        { skipNull: true, skipEmptyString: true }
      );
      const data = await _get(`/api/admin/users${params ? `?${params}` : ""}`);
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
    <>
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
            <Form id="search">
              <Box style={{ display: "inline-flex", width: "100%" }}>
                <Field name="text">
                  {({ field, meta }) => {
                    return (
                      <Input
                        placeholder={"Chercher un Siret, un UAI, une raison sociale, un email"}
                        style={{ margin: 0 }}
                        {...field}
                      />
                    );
                  }}
                </Field>

                <Button variant="primary" type="submit" form="search">
                  Rechercher
                </Button>
              </Box>

              <Box style={{ display: "inline-flex", width: "100%" }}>
                <Field name="academie">
                  {({ field, meta }) => {
                    return <Select placeholder={"Académie (toutes)"} style={{ margin: 0 }} {...field} />;
                  }}
                </Field>

                {/* <Field name="statut">
                  {({ field, meta }) => {
                    return <Select placeholder={"Statuts (tous)"} style={{ margin: 0 }} {...field} />;
                  }}
                </Field> */}

                <Field name="type">
                  {({ field, meta }) => {
                    return (
                      <Select placeholder={"Type (tous)"} style={{ margin: 0 }} {...field}>
                        <option value="Gestionnaire">Organisme responsable</option>
                        <option value="Formateur">Organisme formateur</option>
                      </Select>
                    );
                  }}
                </Field>
              </Box>
              {status.message && <SuccessMessage>{status.message}</SuccessMessage>}
              {error && <ErrorMessage>Une erreur est survenue</ErrorMessage>}
            </Form>
          );
        }}
      </Formik>
      <Table style={{ marginTop: "15px" }}>
        <Thead>
          <Tr>
            <Th width="80px"></Th>

            <Th width="450px">Raison sociale / Ville</Th>
            <Th width="350px">Courriel habilité</Th>

            <Th width={"80px"}>Candidats 2023</Th>
            <Th width={"150px"}>Statut d'avancement</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading || data.users.length === 0 ? (
            <Tr>
              <Td colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Td>
            </Tr>
          ) : (
            data.users.map((user) => {
              return (
                <Tr key={user.username}>
                  {
                    {
                      Gestionnaire: (
                        <>
                          <Td>
                            <Link variant="primary" href={`/admin/gestionnaire/${user.siret}`}>
                              Détail
                            </Link>
                          </Td>
                          <Td>
                            <GestionnaireLibelle gestionnaire={user} /> <Tag>Responsable</Tag>
                          </Td>
                          <Td>
                            <Text>
                              {user.email} <Tag>R</Tag>
                            </Text>
                          </Td>
                          <Td></Td>
                          <Td>
                            <GestionnaireStatut gestionnaire={user} />{" "}
                          </Td>
                        </>
                      ),
                      Formateur: (
                        <>
                          <Td>
                            <Link variant="primary" href={`/admin/formateur/${user.uai}`}>
                              Détail
                            </Link>
                          </Td>
                          <Td>
                            <FormateurLibelle formateur={user} /> <Tag>Formateur</Tag>
                          </Td>
                          <Td>
                            {user.gestionnaires?.map((gestionnaire) => {
                              const etablissement = gestionnaire.etablissements.find(
                                (etablissement) => etablissement.uai === user.uai
                              );

                              return etablissement.diffusionAutorisee ? (
                                <>
                                  <Text>
                                    {user.email ?? etablissement.email} <Tag>D</Tag>
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Text>
                                    {gestionnaire.email} <Tag>R</Tag>
                                  </Text>
                                </>
                              );
                            })}
                          </Td>
                          <Td>{user.nombre_voeux}</Td>
                          <Td>
                            {user.gestionnaires?.map((gestionnaire) => {
                              return <FormateurStatut gestionnaire={gestionnaire} formateur={user} />;
                            })}
                          </Td>
                        </>
                      ),
                    }[user.type]
                  }
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>
      <Box mt={4} mb={4} ml="auto" mr="auto">
        <Pagination pagination={data.pagination} onClick={(page) => search({ ...query, page })} />
      </Box>
    </>
  );
};

export default Users;
