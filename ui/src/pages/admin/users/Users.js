import React, { useCallback, useEffect, useState } from "react";
import { Box, Text, Input, Table, Tbody, Td, Thead, Th, Tr, Link, Select, Spinner } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import queryString from "query-string";

import { Pagination } from "../../../common/components/Pagination";
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
import { FileDownloadLine } from "../../../theme/components/icons/FileDownloadLine";
import { useDownloadStatut } from "../../../common/hooks/adminHooks";

export const Users = () => {
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const [downloading, setDownloading] = useState(false);
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

  const downloadStatut = useDownloadStatut();

  const downloadStatutToCSV = useCallback(async () => {
    try {
      setDownloading(true);
      const params = {
        ...(query?.academie ? { academie: query.academie } : {}),
        ...(self?.academie ? { academie: self?.academie.code } : {}),
      };
      await downloadStatut(params);
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  }, [query, self?.academie, downloadStatut]);

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
                            <option
                              key={academie.code}
                              value={academie.code}
                              disabled={
                                self.academies?.length &&
                                !self.academies.map((academie) => academie.code).includes(academie.code)
                              }
                            >
                              {academie.nom}
                            </option>
                          ))}
                        </Select>
                      );
                    }}
                  </Field>
                </Box>

                <Box w="50%" pl={4}>
                  <Field name="type">
                    {({ field }) => {
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

      <Box display="flex" justifyContent={"right"}>
        <Link onClick={downloadStatutToCSV}>
          {downloading ? <Spinner size="sm" verticalAlign={"middle"} /> : <FileDownloadLine verticalAlign={"middle"} />}{" "}
          Exporter (csv)
        </Link>
      </Box>

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
                            <Text lineHeight={6}>
                              <GestionnaireLibelle gestionnaire={user} />{" "}
                              <OrganismeResponsableTag verticalAlign="baseline" />
                            </Text>
                          </Td>
                          <Td>
                            <Text lineHeight={6}>
                              {user.email} <ContactResponsableTag />
                            </Text>
                          </Td>
                          <Td>{user.nombre_voeux}</Td>
                          <Td>
                            <Text lineHeight={6}>
                              <GestionnaireStatut gestionnaire={user} />{" "}
                            </Text>
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
                            <Text lineHeight={6}>
                              <FormateurLibelle formateur={user} /> <OrganismeFormateurTag verticalAlign="baseline" />
                            </Text>
                          </Td>
                          <Td>
                            <Text lineHeight={6}>
                              {user.gestionnaires?.map((gestionnaire) => {
                                const etablissement = gestionnaire.etablissements.find(
                                  (etablissement) => etablissement.uai === user.uai
                                );

                                return etablissement?.diffusionAutorisee ? (
                                  <>
                                    {user.email ?? etablissement.email} <ContactDelegueTag />
                                  </>
                                ) : (
                                  <>
                                    {gestionnaire.email} <ContactResponsableTag />
                                  </>
                                );
                              })}
                            </Text>
                          </Td>
                          <Td>{user.nombre_voeux}</Td>
                          <Td>
                            <Text lineHeight={6}>
                              {user.gestionnaires?.map((gestionnaire) => {
                                return <FormateurStatut gestionnaire={gestionnaire} formateur={user} />;
                              })}
                            </Text>
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
