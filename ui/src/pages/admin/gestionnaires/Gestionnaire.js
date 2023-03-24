import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import {
  Button,
  Text,
  Input,
  Radio,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Heading,
  Box,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";

import { Page } from "../../../common/components/layout/Page";
import { _get, _put } from "../../../common/httpClient";
import { FormateurLocalite } from "../../../common/components/fields/formateur/Localite";
import { FormateurSiret } from "../../../common/components/fields/formateur/Siret";
import { FormateurUai } from "../../../common/components/fields/formateur/Uai";
import { FormateurLibelle } from "../../../common/components/fields/formateur/Libelle";

const EtablissementEmail = ({ gestionnaire, etablissement, callback }) => {
  const [enableForm, setEnableForm] = useState(false);

  const setEtablissementEmail = useCallback(async ({ form, etablissement }) => {
    try {
      await _put(`/api/gestionnaire/formateurs/${etablissement.uai}`, { email: form.email, diffusionAutorisee: true });
      setEnableForm(false);
      callback();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <>
      {!etablissement.email || enableForm ? (
        <Formik
          initialValues={{
            email: etablissement.email, // formateur.mel ?
          }}
          validationSchema={Yup.object().shape({
            email: Yup.string().required("Requis"),
          })}
          onSubmit={(form) => setEtablissementEmail({ form, etablissement })}
        >
          <Form style={{ display: "inline-flex", width: "100%" }}>
            <Field name="email">
              {({ field, meta }) => {
                return (
                  <Input
                    type="email"
                    role="presentation"
                    placeholder="Renseigner l'email"
                    style={{ margin: 0 }}
                    {...field}
                  />
                );
              }}
            </Field>
            <Button variant="primary" type="submit">
              OK
            </Button>
          </Form>
        </Formik>
      ) : (
        <>
          {etablissement.email}{" "}
          <Link fontSize={"zeta"} textDecoration={"underline"} onClick={() => setEnableForm(true)}>
            Modifier
          </Link>
        </>
      )}
    </>
  );
};

const GestionnairePage = () => {
  const { siret } = useParams();

  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const mounted = useRef(false);

  const getGestionnaire = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/gestionnaires/${siret}`);
      setGestionnaire(response);
    } catch (error) {
      setGestionnaire(undefined);
      throw Error;
    }
  });

  const getFormateurs = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/gestionnaires/${siret}/formateurs`);

      setFormateurs(response);
    } catch (error) {
      setFormateurs(undefined);
      throw Error;
    }
  });

  useEffect(() => {
    const run = async () => {
      if (!mounted.current) {
        getGestionnaire();
        getFormateurs();
      }
      mounted.current = true;
    };
    run();
  }, []);

  const setDiffusionAutorisee = useCallback(async (bool) => {
    try {
      const response = await _put(`/api/admin/gestionnaires/${siret}`, { diffusionAutorisee: bool });
      setGestionnaire(response);
    } catch (error) {
      console.error(error);
    }
  });

  if (!gestionnaire) {
    return;
  }

  return (
    <Page title={`Organisme responsable ${siret}`}>
      <Box my={12}>
        <Heading as="h3" size="md">
          Paramètre de diffusion
        </Heading>
        <Stack mt={8}>
          <Radio
            isDisabled
            isChecked={gestionnaire.diffusionAutorisee === true}
            onClick={() => {
              setDiffusionAutorisee(true);
            }}
          >
            <Text
              onClick={() => {
                setDiffusionAutorisee(true);
              }}
            >
              Diffusion des listes de voeux autorisée.
            </Text>
          </Radio>
          <Radio
            isDisabled
            isChecked={gestionnaire.diffusionAutorisee === false}
            onClick={() => {
              setDiffusionAutorisee(false);
            }}
          >
            <Text
              onClick={() => {
                setDiffusionAutorisee(false);
              }}
            >
              Diffusion des listes de voeux NON autorisée.
            </Text>
          </Radio>
        </Stack>
      </Box>

      <Box my={12}>
        <Heading as="h3" size="md">
          Organismes formateurs associés
        </Heading>

        {formateurs && !gestionnaire.diffusionAutorisee && (
          <Table mt={12}>
            <Thead>
              <Tr>
                <Th width="350px">Raison sociale</Th>
                <Th width="250px">Localité</Th>
                <Th>Siret</Th>
                <Th>UAI</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {formateurs.map((formateur) => {
                const etablissement = gestionnaire.etablissements?.find((etab) => etab.uai === formateur?.uai);

                return (
                  <Tr key={formateur?.uai}>
                    <Td>
                      <FormateurLibelle formateur={formateur} />
                    </Td>
                    <Td>
                      <FormateurLocalite formateur={formateur} />
                    </Td>
                    <Td>
                      <FormateurSiret formateur={formateur} />
                    </Td>
                    <Td>
                      <FormateurUai formateur={formateur} />
                    </Td>
                    <Td>{etablissement?.email ? "<STATUT PLACEHOLDER>" : "<STATUT PLACEHOLDER>"}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}

        {formateurs && gestionnaire.diffusionAutorisee && (
          <Table mt={12}>
            <Thead>
              <Tr>
                <Th width="350px">Raison sociale</Th>
                <Th width="250px">Localité</Th>
                <Th width="375px">Courriel habilité</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {formateurs.map((formateur) => {
                const etablissement = gestionnaire.etablissements?.find((etab) => etab.uai === formateur.uai);
                return (
                  <Tr key={formateur.uai}>
                    <Td>
                      <FormateurLibelle formateur={formateur} />
                    </Td>
                    <Td>
                      <FormateurLocalite formateur={formateur} />
                    </Td>
                    <Td>
                      <EtablissementEmail
                        gestionnaire={gestionnaire}
                        etablissement={etablissement}
                        callback={getGestionnaire}
                      />
                    </Td>
                    <Td>{etablissement.email ? "<STATUT PLACEHOLDER>" : "<STATUT PLACEHOLDER>"}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Box>
    </Page>
  );
};

export default GestionnairePage;
