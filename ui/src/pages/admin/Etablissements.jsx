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
  ListItem,
  UnorderedList,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import queryString from "query-string";

import { Yup } from "../../common/Yup";
import { _get } from "../../common/httpClient";
import { USER_STATUS } from "../../common/constants/UserStatus";
import { useGet } from "../../common/hooks/httpHooks";
import { Pagination } from "../../common/components/Pagination";
import ErrorMessage from "../../common/components/ErrorMessage";
import { useDownloadStatut } from "../../common/hooks/adminHooks";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import { Page } from "../../common/components/layout/Page";
import { ContactStatut } from "../../common/components/admin/fields/ContactStatut";
import { RelationStatut } from "../../common/components/admin/fields/RelationStatut";
import { RelationsStatut } from "../../common/components/admin/fields/RelationsStatut";
import { FileDownloadLine } from "../../theme/components/icons/FileDownloadLine";
import { EtablissementRaisonSociale } from "../../common/components/etablissement/fields/EtablissementLibelle";
import { StatutBadge } from "../../common/components/StatutBadge";
import { WarningFill } from "../../theme/components/icons";

import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

const ListRelations = ({ relations, delegation, limit }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleShowMore = () => {
    setShowMore(!showMore);
  };

  return !delegation ? (
    <>
      <Text mt={4} fontWeight={600}>
        Le contact responsable a un accès exclusif aux candidatures pour le ou les organisme(s) suivant(s) :
      </Text>
      <UnorderedList>
        {relations.slice(0, limit).map((relation, index) => (
          <ListItem mt={2} key={index}>
            <Text display="inline">
              <EtablissementRaisonSociale etablissement={relation.formateur} />,{" "}
              {relation.formateur?.libelle_ville ?? "Ville inconnue"} - Siret : {relation.formateur?.siret ?? "Inconnu"}{" "}
              - UAI : {relation.formateur?.uai ?? "Inconnu"}
            </Text>{" "}
            - <RelationStatut relation={relation} />
            {/*
            {!!relation.nombre_voeux_restant && (
              <Text>
                {relation.nombre_voeux_restant} candidature
                {relation.nombre_voeux_restant > 1 && "s"} non téléchargée
                {relation.nombre_voeux_restant > 1 && "s"}
              </Text>
            )} */}
          </ListItem>
        ))}

        {!showMore && !!(relations?.length > limit) && (
          <Box mt={2} onClick={toggleShowMore}>
            <Text textDecoration={"underline"} cursor="pointer" display={"inline"}>
              Voir {relations?.length - limit} autre
              {!!(relations?.length - limit > 1) && "s"} établissement
              {!!(relations?.length - limit > 1) && "s"}
            </Text>

            {!!relations
              .slice(limit, relations?.length)
              ?.reduce((prev, curr) => prev + curr.nombre_voeux_restant, 0) && (
              <Text>
                {relations.slice(limit, relations?.length)?.reduce((prev, curr) => prev + curr.nombre_voeux_restant, 0)}{" "}
                candidatures non téléchargées
              </Text>
            )}
          </Box>
        )}

        {showMore && !!(relations?.length > limit) && (
          <>
            {relations.slice(limit, relations.length).map((relation, index) => (
              <ListItem mt={2} key={index}>
                <Text display="inline">
                  <EtablissementRaisonSociale etablissement={relation.formateur} />,{" "}
                  {relation.formateur?.libelle_ville ?? "Ville inconnue"} - Siret :{" "}
                  {relation.formateur?.siret ?? "Inconnu"} - UAI : {relation.formateur?.uai ?? "Inconnu"}
                  - <RelationStatut relation={relation} />
                  {/* {!!relation.nombre_voeux_restant && (
                  <Text>
                    {relation.nombre_voeux_restant} candidature
                    {relation.nombre_voeux_restant > 1 && "s"} non téléchargée
                    {relation.nombre_voeux_restant > 1 && "s"}
                    </Text>
                    )} */}
                </Text>
              </ListItem>
            ))}

            <Text mt={2} textDecoration={"underline"} cursor="pointer" onClick={toggleShowMore}>
              Voir moins
            </Text>
          </>
        )}
      </UnorderedList>
    </>
  ) : (
    <>
      <Text mt={4} fontWeight={600}>
        Délégation{relations?.length > 1 && "s"} de droit d'accès :
      </Text>
      <UnorderedList>
        {relations.slice(0, limit).map((relation, index) => (
          <ListItem mt={2} key={index}>
            <Text display="inline">
              <EtablissementRaisonSociale etablissement={relation.formateur} />,{" "}
              {relation.formateur?.libelle_ville ?? "Ville inconnue"} - Siret : {relation.formateur?.siret ?? "Inconnu"}{" "}
              - UAI : {relation.formateur?.uai ?? "Inconnu"}
            </Text>

            <Text>
              Délégué : {relation?.delegue?.email}{" "}
              {relation?.delegue?.relations?.active ? (
                <>
                  {USER_STATUS.ACTIVE !== relation?.delegue?.statut && (
                    <>
                      - <ContactStatut user={relation?.delegue} short />
                    </>
                  )}
                </>
              ) : (
                <>
                  -{" "}
                  <StatutBadge
                    statut="default"
                    short
                    descriptions={
                      new Map([
                        [
                          "default",
                          {
                            icon: <WarningFill mr="2" color="red" />,
                            long: `Délégué en attente de confirmation`,
                            short: "Délégué en attente de confirmation",
                          },
                        ],
                      ])
                    }
                  />
                </>
              )}{" "}
              - <RelationStatut relation={relation} />
            </Text>
          </ListItem>
        ))}

        {!showMore && !!(relations?.length > limit) && (
          <Box mt={2} onClick={toggleShowMore}>
            <Text textDecoration={"underline"} cursor="pointer" display={"inline"}>
              Voir {relations?.length - limit} autre
              {!!(relations?.length - limit > 1) && "s"} établissement
              {!!(relations?.length - limit > 1) && "s"}
            </Text>

            {!!relations
              .slice(limit, relations?.length)
              ?.reduce((prev, curr) => prev + curr.nombre_voeux_restant, 0) && (
              <Text>
                {relations.slice(limit, relations?.length)?.reduce((prev, curr) => prev + curr.nombre_voeux_restant, 0)}{" "}
                candidatures non téléchargées
              </Text>
            )}
          </Box>
        )}

        {showMore && !!(relations?.length > limit) && (
          <>
            {relations.slice(limit, relations.length).map((relation, index) => (
              <ListItem mt={2} key={index}>
                <Text display="inline">
                  <EtablissementRaisonSociale etablissement={relation.formateur} />,{" "}
                  {relation.formateur?.libelle_ville ?? "Ville inconnue"} - Siret :{" "}
                  {relation.formateur?.siret ?? "Inconnu"} - UAI : {relation.formateur?.uai ?? "Inconnu"}
                </Text>

                <Text>
                  Délégué : {relation?.delegue?.email}{" "}
                  {relation?.delegue?.relations?.active ? (
                    <>
                      {USER_STATUS.ACTIVE !== relation?.delegue?.statut && (
                        <>
                          - <ContactStatut user={relation?.delegue} short />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      -{" "}
                      <StatutBadge
                        statut="default"
                        short
                        descriptions={
                          new Map([
                            [
                              "default",
                              {
                                icon: <WarningFill mr="2" color="red" />,
                                long: `Délégué en attente de confirmation`,
                                short: "Délégué en attente de confirmation",
                              },
                            ],
                          ])
                        }
                      />
                    </>
                  )}{" "}
                  - <RelationStatut relation={relation} />
                </Text>
              </ListItem>
            ))}

            <Text mt={2} textDecoration={"underline"} cursor="pointer" onClick={toggleShowMore}>
              Voir moins
            </Text>
          </>
        )}
      </UnorderedList>
    </>
  );
};

export const Etablissements = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mounted = useRef(false);

  const defaultLimit = 3;
  const [limit, setLimit] = useState(defaultLimit);

  const [abortController, setAbortController] = useState(new AbortController());
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

  const [academies] = useGet("/api/constant/academies", []);
  const [self] = useGet("/api/admin", null);

  const initialValues = useMemo(
    () => ({
      text: searchParams?.get("text") ?? "",
      ...(self?.academies?.length === 1
        ? { academie: self?.academies[0].code }
        : { ...(searchParams?.get("academie") ? { academie: searchParams?.get("academie") } : {}) }),
      ...(searchParams?.get("missing_email") === "true"
        ? { missing_email: searchParams?.get("missing_email") === "true" }
        : {}),
      ...(searchParams?.get("page") ? { page: searchParams?.get("page") } : { page: 1 }),
    }),
    [searchParams, self?.academies]
  );

  const search = useCallback(
    async (values) => {
      values?.text?.length ? setLimit(100) : setLimit(defaultLimit);

      const params = new URLSearchParams(values);
      if (values) {
        setSearchParams(params, { replace: true });
      }

      abortController?.abort();
      try {
        const controller = new AbortController();
        setAbortController(controller);
        setLoading(true);
        setQuery(values);
        const params = queryString.stringify(
          {
            ...values,
            sort: JSON.stringify({ statut: -1, nombre_voeux_restant: -1, relations_count: -1 }),
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
    [abortController, setSearchParams, self?.academies]
  );

  const { downloadStatut, isDownloadingStatut } = useDownloadStatut();

  const downloadStatutToCSV = useCallback(async () => {
    try {
      const params = {
        ...(query?.academie ? { academie: query.academie } : {}),
        ...(self?.academies?.length === 1 ? { academie: self?.academies[0].code } : {}),
      };
      await downloadStatut(params);
    } catch (e) {
      console.error(e);
    }
  }, [query, self?.academies, downloadStatut]);

  const callback = useCallback(
    async (values) => {
      await search({ ...values, page: 1 });
    },
    [search]
  );

  useEffect(() => {
    const run = async () => {
      await search(initialValues);
    };

    if (!mounted.current) {
      run();
    }

    return () => {
      mounted.current = true;
    };
  }, [search, initialValues]);

  if (!self) {
    return;
  }

  return (
    <>
      <Breadcrumb items={[]} />
      <Page title="Listes de candidats Affelnet : console de pilotage">
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={Yup.object().shape({
            text: Yup.string(),
          })}
          onSubmit={callback}
          onChange={callback}
        >
          {({ handleSubmit, handleChange, values, submitForm }) => {
            return (
              <Form id="search">
                <Box w="100%" display="inline-flex">
                  <Box w="20%" m={4}>
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

                  <Box w="80%" style={{ display: "inline-flex", width: "100%" }} m={4}>
                    <Field name="text">
                      {({ field, meta }) => {
                        return (
                          <Input
                            placeholder={"Chercher un SIRET, un UAI, une raison sociale, un email"}
                            style={{ margin: 0 }}
                            onChange={(value) => {
                              handleChange(value);
                              handleSubmit();
                            }}
                            onInput={handleSubmit}
                            {...field}
                          />
                        );
                      }}
                    </Field>
                  </Box>
                </Box>

                <Box w="100%" display="inline-flex" m={4}>
                  <Field name="missing_email">
                    {({ field, meta }) => {
                      return (
                        <Checkbox
                          onChange={(value) => {
                            handleChange(value);
                            handleSubmit();
                          }}
                          onInput={handleSubmit}
                          isChecked={field.value}
                          {...field}
                        >
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
            {isDownloadingStatut ? (
              <Spinner size="sm" verticalAlign={"middle"} />
            ) : (
              <FileDownloadLine verticalAlign={"middle"} />
            )}{" "}
            Exporter (csv)
          </Link>
        </Box>

        <Table style={{ marginTop: "15px" }}>
          <Thead>
            <Tr borderBottom="2px solid" borderColor="gray.200">
              {/* <Th width="80px"></Th> */}
              <Th width="750px">Organismes et contacts habilités</Th>
              {/* <Th width="350px">Organismes responsable</Th>
              <Th width="450px">Organismes formateurs et contacts habilités</Th> */}

              <Th width={"120px"}>Candidatures</Th>
              {/* <Th width={"70px"}>Restant à télécharger</Th> */}
              {/* <Th>Statut</Th> */}
            </Tr>
          </Thead>
          <Tbody>
            {loading || data.length === 0 ? (
              <Tr borderBottom="2px solid" borderColor="gray.200">
                <Td colSpan={6}>{loading ? <Progress size="xs" isIndeterminate /> : "Pas de résultats"}</Td>
              </Tr>
            ) : (
              data.map((etablissement, index) => {
                const relationsDelegues = etablissement.relations
                  .filter(
                    (relation) =>
                      relation.responsable.siret === etablissement.siret &&
                      !!relation.delegue /* && !!relation.delegue.relations?.active*/
                  )
                  .sort(
                    (a, b) =>
                      b.nombre_voeux_restant - a.nombre_voeux_restant ||
                      b.nombre_voeux - a.nombre_voeux ||
                      -b.formateur?.raison_sociale?.localeCompare(a.formateur.raison_sociale) ||
                      -b.formateur?.libelle_ville?.localeCompare(a.formateur.libelle_ville)
                  );
                const relationsNonDelegues = etablissement.relations
                  .filter(
                    (relation) =>
                      relation.responsable.siret === etablissement.siret &&
                      !relation.delegue /* || !relation.delegue.relations?.active*/
                  )
                  .sort(
                    (a, b) =>
                      b.nombre_voeux_restant - a.nombre_voeux_restant ||
                      -b.formateur?.raison_sociale?.localeCompare(a.formateur.raison_sociale)
                  );

                return (
                  <Tr key={index} borderBottom="2px solid" borderColor="gray.200">
                    <Td verticalAlign={"top"}>
                      <Box lineHeight={6}>
                        <Text as="b">
                          <EtablissementRaisonSociale etablissement={etablissement} />,{" "}
                          {etablissement.libelle_ville ?? "Ville inconnue"} - Siret : {etablissement.siret ?? "Inconnu"}{" "}
                          - UAI : {etablissement.uai ?? "Inconnu"}
                        </Text>
                      </Box>

                      <Box lineHeight={6}>
                        <Text>
                          Contact responsable : {/*<Text as="b">*/}
                          {etablissement.email ?? "Information manquante"}
                          {/*</Text>*/}
                        </Text>
                        {etablissement.relations?.length === 1 && etablissement.relations?.[0].delegue ? (
                          <Text mt={4}>
                            Délégation de droit d'accès accordée à {etablissement.relations?.[0].delegue?.email}
                          </Text>
                        ) : (
                          <>
                            {!!relationsNonDelegues?.length && (
                              <ListRelations relations={relationsNonDelegues} limit={limit} />
                            )}

                            {!!relationsDelegues?.length && (
                              <ListRelations relations={relationsDelegues} limit={limit} delegation />
                            )}
                          </>
                        )}
                      </Box>
                    </Td>
                    <Td verticalAlign={"top"}>
                      <Box lineHeight={6}>
                        <Text mt={4}>
                          <Link variant="primary" href={`/admin/etablissement/${etablissement.siret}`}>
                            Accéder au détail
                          </Link>
                        </Text>

                        <Text mt={6}>
                          <ContactStatut user={etablissement} short />
                        </Text>

                        <Text mt={6}>
                          <RelationsStatut etablissement={etablissement} />
                        </Text>
                      </Box>
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
