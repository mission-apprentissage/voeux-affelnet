import React, { useCallback, useEffect, useState } from "react";
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
import { useGet } from "../../../common/hooks/httpHooks";
import { ContactDelegueTag } from "../../../common/components/tags/ContactDelegue";
import { OrganismeFormateurTag } from "../../../common/components/tags/OrganismeFormateur";
import { ContactResponsableTag } from "../../../common/components/tags/ContactResponsable";
import { OrganismeResponsableTag } from "../../../common/components/tags/OrganismeResponsable";

export const Users = () => {
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const [query, setQuery] = useState();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    items_par_page: 0,
    nombre_de_page: 0,
    total: 0,
  });

  const [academies] = useGet("/api/admin/academies", []);
  const [self] = useGet("/api/admin", null);

  const search = useCallback(
    async (values) => {
      try {
        setQuery(values);
        const params = queryString.stringify(
          {
            ...values,
            sort: JSON.stringify({ type: -1, nombre_voeux: -1 }),
            ...(self?.academie ? { academie: self?.academie.code } : {}),
          },
          { skipNull: true, skipEmptyString: true }
        );
        const response = await _get(`/api/admin/users${params ? `?${params}` : ""}`);

        setLoading(false);
        setData(response.users);
        setPagination(response.pagination);
        setError(undefined);
      } catch (e) {
        console.error(e);
        setLoading(false);
        setError(e);
      }
    },
    [self]
  );

  useEffect(() => {
    const run = async () => {
      await search();
    };

    run();
  }, [search]);

  const callback = useCallback(
    async (values) => {
      console.log(values);
      await search({ page: 1, ...values });
    },
    [search]
  );

  if (!self) {
    return;
  }

  return (
    <>
      <Formik
        enableReinitialize
        initialValues={{
          text: "",
          academie: self.academie?.code,
        }}
        validationSchema={Yup.object().shape({
          text: Yup.string(),
        })}
        onSubmit={callback}
        onChange={callback}
      >
        {({ handleSubmit, handleChange, values, submitForm }) => {
          return (
            <Form id="search">
              <Box style={{ display: "inline-flex", width: "100%" }} m={4}>
                <Box w="50%" pr={4}>
                  <Field name="academie">
                    {({ field, setFieldValue, meta }) => {
                      return (
                        <Select
                          placeholder={"Académie (toutes)"}
                          disabled={self.academie}
                          {...field}
                          onChange={(value) => {
                            handleChange(value);
                            handleSubmit();
                          }}
                        >
                          {academies.map((academie) => (
                            <option key={academie.code} value={academie.code}>
                              {academie.nom}
                            </option>
                          ))}
                        </Select>
                      );
                    }}
                  </Field>
                </Box>

                {/* <Field name="statut">
                  {({ field, meta }) => {
                    return <Select placeholder={"Statuts (tous)"} style={{ margin: 0 }} {...field} />;
                  }}
                </Field> */}

                <Box w="50%" pl={4}>
                  <Field name="type">
                    {({ field, setFieldValue, meta }) => {
                      return (
                        <Select
                          placeholder={"Type d'organisme (tous)"}
                          {...field}
                          onChange={(value) => {
                            handleChange(value);
                            handleSubmit();
                          }}
                        >
                          <option value="Gestionnaire">Organisme responsable</option>
                          <option value="Formateur">Organisme formateur</option>
                        </Select>
                      );
                    }}
                  </Field>
                </Box>
              </Box>

              <Box style={{ display: "inline-flex", width: "100%" }} m={4}>
                <Field name="text">
                  {({ field, meta }) => {
                    return (
                      <Input
                        placeholder={"Chercher un Siret, un UAI, une raison sociale, un email"}
                        style={{ margin: 0 }}
                        onChange={handleSubmit}
                        onInput={handleSubmit}
                        {...field}
                      />
                    );
                  }}
                </Field>
                {/*
                <Button variant="primary" type="submit" form="search">
                  Rechercher
                </Button> */}
              </Box>

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

            <Th width={"80px"}>Candidats</Th>
            <Th>Statut</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading || data.length === 0 ? (
            <Tr>
              <Td colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Td>
            </Tr>
          ) : (
            data.map((user, index) => {
              return (
                <Tr key={index}>
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
                            <GestionnaireLibelle gestionnaire={user} /> <OrganismeResponsableTag />
                          </Td>
                          <Td>
                            <Text>
                              {user.email} <ContactResponsableTag />
                            </Text>
                          </Td>
                          <Td>{user.nombre_voeux}</Td>
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
                            <FormateurLibelle formateur={user} /> <OrganismeFormateurTag />
                          </Td>
                          <Td>
                            {user.gestionnaires?.map((gestionnaire) => {
                              const etablissement = gestionnaire.etablissements.find(
                                (etablissement) => etablissement.uai === user.uai
                              );

                              return etablissement?.diffusionAutorisee ? (
                                <>
                                  <Text>
                                    {user.email ?? etablissement.email} <ContactDelegueTag />
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Text>
                                    {gestionnaire.email} <ContactResponsableTag />
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
        <Pagination pagination={pagination} onClick={(page) => search({ ...query, page })} />
      </Box>
    </>
  );
};

export default Users;
