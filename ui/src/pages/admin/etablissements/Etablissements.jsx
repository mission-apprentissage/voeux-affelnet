import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Text,
  Input,
  Table,
  Tbody,
  Td,
  Thead,
  Th,
  Tr,
  Link,
  Select,
  Spinner,
  Progress,
  Checkbox,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import queryString from "query-string";

import { Pagination } from "../../../common/components/Pagination";
import ErrorMessage from "../../../common/components/ErrorMessage";
import { Yup } from "../../../common/Yup";
import { _get } from "../../../common/httpClient";
import { EtablissementLibelle } from "../../../common/components/etablissement/fields/EtablissementLibelle";
import { FormateurStatut } from "../../../common/components/admin/fields/FormateurStatut";
import { ResponsableStatut } from "../../../common/components/admin/fields/ResponsableStatut";
import { useGet } from "../../../common/hooks/httpHooks";
import { OrganismeResponsableTag } from "../../../common/components/tags/OrganismeResponsable";
import { OrganismeFormateurTag } from "../../../common/components/tags/OrganismeFormateur";
import { OrganismeResponsableFormateurTag } from "../../../common/components/tags/OrganismeResponsableFormateur";
import { FileDownloadLine } from "../../../theme/components/icons/FileDownloadLine";
import { useDownloadStatut } from "../../../common/hooks/adminHooks";
import { Breadcrumb } from "../../../common/components/Breadcrumb";
import { Page } from "../../../common/components/layout/Page";
import { RelationType } from "../../../common/constants/RelationType";
import { ContactResponsableTag } from "../../../common/components/tags/ContactResponsable";
import { ContactDelegueTag } from "../../../common/components/tags/ContactDelegue";

export const Etablissements = () => {
  const mounted = useRef(true);

  const [abortController, setAbortController] = useState(new AbortController());
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

  const [academies] = useGet("/api/constant/academies", []);
  const [self] = useGet("/api/admin", null);

  const search = useCallback(
    async (values) => {
      abortController?.abort();
      try {
        const controller = new AbortController();
        setAbortController(controller);
        setLoading(true);
        setQuery(values);
        const params = queryString.stringify(
          {
            ...values,
            sort: JSON.stringify({ type: -1, nombre_voeux_restant: -1 }),
            ...(self?.academies?.length === 1 ? { academie: self?.academies[0].code } : {}),
          },
          { skipNull: true, skipEmptyString: true }
        );
        const response = await _get(`/api/admin/etablissements${params ? `?${params}` : ""}`, {
          signal: controller.signal,
        });

        setLoading(false);
        setData(response.etablissements);
        setPagination(response.pagination);
        // setStats(response.stats);
        setError(undefined);
      } catch (e) {
        if (!(e.name === "AbortError")) {
          console.error(e);
          setLoading(false);
          setError(e);
        }
      }
    },
    [self, abortController, setAbortController]
  );

  const downloadStatut = useDownloadStatut();

  const downloadStatutToCSV = useCallback(async () => {
    try {
      setDownloading(true);
      const params = {
        ...(query?.academie ? { academie: query.academie } : {}),
        ...(self?.academies?.length === 1 ? { academie: self?.academies[0].code } : {}),
      };
      await downloadStatut(params);
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  }, [query, self?.academies, downloadStatut]);

  // useEffect(() => {
  //   const run = async () => {
  //     await search();
  //   };

  //   run();
  // }, [search]);

  const callback = useCallback(
    async (values) => {
      // console.log(values);
      await search({ page: 1, ...values });
    },
    [search]
  );

  useEffect(() => {
    const run = async () => {
      await callback();
    };

    if (mounted.current) {
      run();
    }

    return () => {
      mounted.current = false;
    };
  }, [callback]);

  if (!self) {
    return;
  }

  return (
    <>
      <Breadcrumb items={[]} />
      <Page title="Listes de candidats Affelnet : console de pilotage">
        <Formik
          enableReinitialize
          initialValues={{
            text: "",
            ...(self?.academies?.length === 1 ? { academie: self?.academies[0].code } : {}),
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
                            disabled={self.academies?.length === 1}
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
                            <option value={RelationType.RESPONSABLE}>Organisme responsable</option>
                            <option value={RelationType.FORMATEUR}>Organisme formateur</option>
                            <option value={RelationType.RESPONSABLE_FORMATEUR}>Organisme responsable-formateur</option>
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
                          placeholder={"Chercher un SIRET, un UAI, une raison sociale, un email"}
                          style={{ margin: 0 }}
                          onChange={handleSubmit}
                          onInput={handleSubmit}
                          {...field}
                        />
                      );
                    }}
                  </Field>
                </Box>

                <Box style={{ display: "inline-flex", width: "100%" }} m={4}>
                  <Field name="missing_email">
                    {({ field, meta }) => {
                      return (
                        <Checkbox onChange={handleSubmit} onInput={handleSubmit} {...field}>
                          Limiter aux établissements sans adresse courriel
                        </Checkbox>
                      );
                    }}
                  </Field>
                </Box>

                {error && <ErrorMessage>Une erreur est survenue</ErrorMessage>}
              </Form>
            );
          }}
        </Formik>

        <Box display="flex" justifyContent={"right"}>
          <Link onClick={downloadStatutToCSV}>
            {downloading ? (
              <Spinner size="sm" verticalAlign={"middle"} />
            ) : (
              <FileDownloadLine verticalAlign={"middle"} />
            )}{" "}
            Exporter (csv)
          </Link>
        </Box>

        <Table style={{ marginTop: "15px" }}>
          <Thead>
            <Tr>
              <Th width="80px"></Th>

              <Th width="450px">Raison sociale / Ville</Th>
              <Th width="350px">Courriel habilité</Th>

              <Th width={"70px"}>Candidats</Th>
              <Th width={"70px"}>Restant à télécharger</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading || data.length === 0 ? (
              <Tr>
                <Td colSpan={6}>{loading ? <Progress size="xs" isIndeterminate /> : "Pas de résultats"}</Td>
              </Tr>
            ) : (
              data.map((etablissement, index) => {
                const isOnlyResponsableFormateur =
                  etablissement.is_responsable_formateur && etablissement.relations.length === 1;

                const relationsResponsable = etablissement.relations.filter(
                  (relation) => relation.responsable?.siret === etablissement.siret
                );

                const relationsFormateur = etablissement.relations.filter(
                  (relation) => relation.formateur?.siret === etablissement.siret
                );

                const relationsOnlyResponsable = relationsResponsable.filter(
                  (relation) => relation.formateur?.siret !== etablissement.siret
                );

                const relationsOnlyFormateur = relationsFormateur.filter(
                  (relation) => relation.responsable?.siret !== etablissement.siret
                );

                const relationResponsableFormateur = etablissement.relations.find(
                  (relation) =>
                    relation.formateur?.siret === etablissement.siret &&
                    relation.responsable?.siret === etablissement.siret
                );

                return (
                  <Tr key={index}>
                    <Td>
                      <Link variant="primary" href={`/admin/etablissement/${etablissement.siret}`}>
                        Détail
                      </Link>
                    </Td>
                    <Td>
                      <Text lineHeight={6}>
                        <EtablissementLibelle etablissement={etablissement} />{" "}
                        {!isOnlyResponsableFormateur && !!relationsOnlyResponsable?.length && (
                          <OrganismeResponsableTag verticalAlign="baseline" ml={2} />
                        )}
                        {etablissement.is_responsable_formateur && (
                          <OrganismeResponsableFormateurTag verticalAlign="baseline" ml={2} />
                        )}
                        {!isOnlyResponsableFormateur && !!relationsOnlyFormateur?.length && (
                          <OrganismeFormateurTag verticalAlign="baseline" ml={2} />
                        )}
                      </Text>
                    </Td>
                    <Td>
                      <Text lineHeight={6}>
                        {!isOnlyResponsableFormateur && !!relationsOnlyResponsable?.length && (
                          <>
                            {etablissement.email ?? "Information manquante"} <ContactResponsableTag />
                            <br />
                          </>
                        )}

                        {isOnlyResponsableFormateur && (
                          <>
                            {(() => {
                              if (
                                !relationResponsableFormateur.delegue &&
                                !!relationsOnlyResponsable?.find(
                                  (relation) =>
                                    relation.responsable.email === relationResponsableFormateur.responsable?.email
                                )
                              ) {
                                return;
                              }

                              return !relationResponsableFormateur.delegue ? (
                                <>
                                  {relationResponsableFormateur.responsable?.email ?? "Information manquante"}{" "}
                                  <ContactResponsableTag />
                                  <br />
                                </>
                              ) : (
                                <>
                                  {relationResponsableFormateur.delegue?.email ?? "Information manquante"}{" "}
                                  <ContactDelegueTag />
                                  <br />
                                </>
                              );
                            })()}
                          </>
                        )}

                        {!isOnlyResponsableFormateur &&
                          !!relationsOnlyFormateur?.length &&
                          (() => {
                            const responsables = [
                              ...new Set(
                                relationsOnlyFormateur
                                  ?.filter((relation) => !relation.delegue)
                                  .map((relation) => relation.responsable?.email ?? "Information manquante")
                              ),
                            ];

                            const delegues = [
                              ...new Set(
                                relationsOnlyFormateur
                                  ?.filter((relation) => !!relation.delegue)
                                  .map((relation) => relation.delegue?.email ?? "Information manquante")
                              ),
                            ];

                            return (
                              <>
                                {responsables?.map((responsable) => (
                                  <>
                                    {responsable} <ContactResponsableTag />
                                    <br />
                                  </>
                                ))}
                                {delegues?.map((delegue) => (
                                  <>
                                    {delegue} <ContactDelegueTag />
                                    <br />
                                  </>
                                ))}
                              </>
                            );
                          })()}
                      </Text>
                    </Td>
                    <Td>
                      {etablissement.relations
                        ?.reduce((acc, etablissement) => acc + +etablissement.nombre_voeux, 0)
                        .toLocaleString()}
                    </Td>
                    <Td>
                      {etablissement.relations
                        ?.reduce((acc, etablissement) => acc + +etablissement.nombre_voeux_restant, 0)
                        .toLocaleString()}
                    </Td>
                    <Td>
                      <Text lineHeight={6}>
                        {!isOnlyResponsableFormateur && !!relationsOnlyResponsable?.length && (
                          <ResponsableStatut responsable={etablissement} />
                        )}

                        {isOnlyResponsableFormateur && (
                          <>
                            <FormateurStatut relation={relationResponsableFormateur} />
                          </>
                        )}

                        {!isOnlyResponsableFormateur &&
                          !!relationsOnlyFormateur?.length &&
                          relationsOnlyFormateur?.map((relation) => {
                            return <FormateurStatut relation={relation} />;
                          })}
                      </Text>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
        <Box mt={4} mb={4} ml="auto" mr="auto">
          <Pagination pagination={pagination} onClick={(page) => search({ ...query, page })} />
        </Box>
      </Page>
    </>
  );
};

export default Etablissements;
