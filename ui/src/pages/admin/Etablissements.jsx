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
  UnorderedList,
  ListItem,
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
            sort: JSON.stringify({ /*type: -1,*/ nombre_voeux_restant: -1 }),
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

  const callback = useCallback(
    async (values) => {
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
                            onChange={handleSubmit}
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
              <Tr>
                <Td colSpan={6}>{loading ? <Progress size="xs" isIndeterminate /> : "Pas de résultats"}</Td>
              </Tr>
            ) : (
              data.map((etablissement, index) => {
                const relationsDelegues = etablissement.relations.filter(
                  (relation) => !!relation.delegue && !!relation.delegue.relations?.active
                );
                const relationsNonDelegues = etablissement.relations.filter(
                  (relation) => !relation.delegue || !relation.delegue.relations?.active
                );

                // const isOnlyResponsableFormateur =
                //   etablissement.is_responsable_formateur && etablissement.relations.length === 1;

                // const relationsResponsable = etablissement.relations.filter(
                //   (relation) => relation.responsable?.siret === etablissement.siret
                // );

                // const relationsFormateur = etablissement.relations.filter(
                //   (relation) => relation.formateur?.siret === etablissement.siret
                // );

                // const relationsOnlyResponsable = relationsResponsable.filter(
                //   (relation) => relation.formateur?.siret !== etablissement.siret
                // );

                // const relationsOnlyFormateur = relationsFormateur.filter(
                //   (relation) => relation.responsable?.siret !== etablissement.siret
                // );

                // const relationResponsableFormateur = etablissement.relations.find(
                //   (relation) =>
                //     relation.formateur?.siret === etablissement.siret &&
                //     relation.responsable?.siret === etablissement.siret
                // );

                return (
                  <Tr key={index}>
                    {/* <Td>
                      <Link variant="primary" href={`/admin/etablissement/${etablissement.siret}`}>
                        Détail
                      </Link>
                    </Td> */}
                    <Td verticalAlign={"top"}>
                      <Box lineHeight={6}>
                        <Text as="b">
                          {etablissement.raison_sociale ?? "Raison sociale inconnue"},{" "}
                          {etablissement.libelle_ville ?? "Ville inconnue"}{" "}
                        </Text>
                        <Text>
                          <Text as="i" color="gray.500">
                            Siret : {etablissement.siret ?? "Inconnu"} - UAI : {etablissement.uai ?? "Inconnu"}
                          </Text>
                        </Text>

                        {/* {etablissement.is_responsable && <OrganismeResponsableTag verticalAlign="baseline" ml={2} />}
                        {etablissement.is_responsable_formateur && (
                          <OrganismeResponsableFormateurTag verticalAlign="baseline" ml={2} />
                        )}
                        {etablissement.is_formateur && <OrganismeFormateurTag verticalAlign="baseline" ml={2} />} */}
                      </Box>
                      {/* </Td>
                    <Td> */}
                      <Box lineHeight={6}>
                        <Text>
                          Contact responsable : <Text as="b">{etablissement.email ?? "Information manquante"}</Text>
                        </Text>
                        {etablissement.relations?.length === 1 && etablissement.relations?.[0].delegue ? (
                          <Text mt={4}>
                            Délégation de droit d'accès accordée à {etablissement.relations?.[0].delegue?.email}
                          </Text>
                        ) : (
                          <>
                            {!!relationsNonDelegues?.length && (
                              <>
                                <Text mt={4}>
                                  {/* Habilité pour {relationsNonDelegues.length} établissement
                                    {relationsNonDelegues.length > 1 && "s"} : */}
                                  Accès exclusif aux candidatures :
                                </Text>
                                <UnorderedList>
                                  {relationsNonDelegues /*.slice(0, 5)*/
                                    .map((relation, index) => (
                                      <ListItem mt={2} key={index}>
                                        <Text display="inline">
                                          {relation.formateur?.raison_sociale ?? "Raison sociale inconnue"},{" "}
                                          {relation.formateur?.libelle_ville ?? "Ville inconnue"}{" "}
                                        </Text>
                                        <Text>
                                          <Text as="i" color="gray.500">
                                            Siret : {relation.formateur?.siret ?? "Inconnu"} - UAI :{" "}
                                            {relation.formateur?.uai ?? "Inconnu"}
                                          </Text>
                                        </Text>
                                        {!!relation.nombre_voeux_restant && (
                                          <Text>
                                            {relation.nombre_voeux_restant} candidature
                                            {relation.nombre_voeux_restant > 1 && "s"} non téléchargée
                                            {relation.nombre_voeux_restant > 1 && "s"}
                                          </Text>
                                        )}
                                      </ListItem>
                                    ))}
                                  {/* {!!(relationsNonDelegues?.length > 5) && (
                                    <ListItem mt={2}>
                                      <Text>
                                        {relationsNonDelegues?.length - 5} autre
                                        {!!(relationsNonDelegues?.length - 5 > 1) && "s"} établissement
                                        {!!(relationsNonDelegues?.length - 5 > 1) && "s"}
                                      </Text>

                                      {!!(relationsNonDelegues
                                        .slice(0, 5)
                                        ?.reduce((prev, curr) => prev + curr.nombre_voeux_restant),
                                      0) && (
                                        <Text>
                                          {
                                            (relationsNonDelegues
                                              .slice(0, 5)
                                              ?.reduce((prev, curr) => prev + curr.nombre_voeux_restant),
                                            0)
                                          }{" "}
                                          candidatures non téléchargées
                                        </Text>
                                      )}
                                    </ListItem>
                                  )} */}
                                </UnorderedList>
                              </>
                            )}

                            {!!relationsDelegues?.length && (
                              <>
                                <Text mt={4}>Délégation{relationsDelegues?.length > 1 && "s"} de droit d'accès :</Text>
                                <UnorderedList>
                                  {relationsDelegues /*.slice(0, 5)*/
                                    .map((relation, index) => (
                                      <ListItem mt={2} key={index}>
                                        <Text display="inline">
                                          {relation.formateur?.raison_sociale ?? "Raison sociale inconnue"},{" "}
                                          {relation.formateur?.libelle_ville ?? "Ville inconnue"}{" "}
                                        </Text>
                                        <Text>
                                          <Text as="i" color="gray.500">
                                            Siret : {relation.formateur?.siret ?? "Inconnu"} - UAI :{" "}
                                            {relation.formateur?.uai ?? "Inconnu"}
                                          </Text>
                                        </Text>
                                        <Text>
                                          Délégué : <Text as="b">{relation.delegue?.email}</Text>{" "}
                                          {USER_STATUS.ACTIVE !== relation?.delegue?.statut && (
                                            <>
                                              - <ContactStatut user={relation?.delegue} short />
                                            </>
                                          )}{" "}
                                          {!!relation.nombre_voeux && (
                                            <>
                                              - <RelationStatut relation={relation} />
                                            </>
                                          )}
                                        </Text>
                                        {/* {!!relation.nombre_voeux_restant && (
                                        <Text>
                                          {relation.nombre_voeux_restant} candidature
                                          {relation.nombre_voeux_restant > 1 && "s"} non téléchargée
                                          {relation.nombre_voeux_restant > 1 && "s"}
                                        </Text>
                                      )} */}
                                      </ListItem>
                                    ))}
                                  {/* {!!(relationsDelegues?.length > 5) && (
                                    <ListItem mt={2}>
                                      <Text>
                                        {relationsDelegues?.length - 5} autre
                                        {!!(relationsDelegues?.length - 5 > 1) && "s"} établissement
                                        {!!(relationsDelegues?.length - 5 > 1) && "s"}
                                      </Text>

                                      {!!(relationsDelegues
                                        .slice(0, 5)
                                        ?.reduce((prev, curr) => prev + curr.nombre_voeux_restant),
                                      0) && (
                                        <Text>
                                          {
                                            (relationsDelegues
                                              .slice(0, 5)
                                              ?.reduce((prev, curr) => prev + curr.nombre_voeux_restant),
                                            0)
                                          }{" "}
                                          candidatures non téléchargées
                                        </Text>
                                      )}
                                    </ListItem>
                                  )} */}
                                </UnorderedList>
                              </>
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

                        {USER_STATUS.ACTIVE !== etablissement.statut && (
                          <>
                            <Text mt={6}>
                              <ContactStatut user={etablissement} short />
                            </Text>
                            {/* <Text mt={4}>Nombre de candidatures : {etablissement.nombre_voeux}</Text> */}
                            {/* <Text mt={4}>Restant à télécharger : {etablissement.nombre_voeux_restant}</Text> */}
                          </>
                        )}

                        <Text mt={6}>
                          <RelationsStatut relations={etablissement.relations} />
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
