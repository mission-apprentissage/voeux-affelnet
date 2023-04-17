import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Tbody,
  Td,
  Tr,
  Thead,
  Table,
  Stack,
} from "@chakra-ui/react";

import { Yup } from "../common/Yup";
import { _get } from "../common/httpClient";
import { sortDescending } from "../common/utils/dateUtils";
import ErrorMessage from "../common/components/ErrorMessage";
import { Page } from "../common/components/layout/Page";

function getDownloadStatus(gestionnaire, formateur) {
  let statut;

  console.log({ gestionnaire, formateur });

  if (!gestionnaire || !formateur) {
    return;
  }

  const etablissement = gestionnaire.etablissements?.find((etab) => etab.uai === formateur.uai);
  const telechargements = gestionnaire.voeux_telechargements
    ?.sort((a, b) => sortDescending(a.date, b.date))
    .filter((t) => t.uai === formateur.uai);

  console.log(formateur.uai, {
    etablissement,
    telechargements,
    telecharges: telechargements.find((v) => v.date > etablissement?.voeux_date),
  });

  switch (true) {
    case !etablissement.voeux_date:
      statut = "Pas de voeux";
      break;
    case !!etablissement.voeux_date && !telechargements?.length:
      statut = "Pas encore téléchargés";
      break;
    case !!etablissement.voeux_date &&
      !!telechargements.length &&
      !telechargements.find((t) => t.date > etablissement?.voeux_date):
      statut = "En partie téléchargés";
      break;
    case !!etablissement.voeux_date &&
      !!telechargements.length &&
      !!telechargements.find((t) => t.date > etablissement?.voeux_date):
      statut = "Téléchargés";
      break;
    default:
      statut = "Inconnu";
      break;
  }
  return statut;
}

function ReceptionVoeuxPage() {
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
    <Page
      title="Diffusion des listes de vœux exprimés sur le service en ligne Affelnet : identifiez les établissements
            d'accueil qui vous sont rattachés ou votre organisme responsable"
    >
      <br />

      <Card mb={4}>
        <CardHeader>
          <Heading as="h3" size="sm">
            1/ vous êtes un établissement responsable (signataire des conventions de formation) et vous souhaitez savoir
            pour quelles UAI d’accueil vous allez recevoir la liste des vœux exprimés sur le service en ligne Affelnet ?
          </Heading>
        </CardHeader>
        <CardBody>
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
                <Form style={{ width: "80%", margin: "auto" }}>
                  <Stack direction="row">
                    <Field name="search">
                      {({ field, meta }) => {
                        return (
                          <Input
                            placeholder="Rechercher un siret, une raison sociale du responsable"
                            style={{ margin: 0 }}
                            {...field}
                          />
                        );
                      }}
                    </Field>
                    <Button variant="primary" type="submit">
                      Rechercher
                    </Button>
                  </Stack>

                  {gestionnaireError && (
                    <ErrorMessage>
                      L'établissement n'a pas été trouvé. Vous pouvez relancer une nouvelle recherche avec un autre
                      paramètre.
                    </ErrorMessage>
                  )}
                </Form>
              );
            }}
          </Formik>

          {gestionnaireData &&
            gestionnaireData.map((result, index) => (
              <React.Fragment key={index}>
                <br />
                <div style={{ borderLeft: "2px solid black", paddingLeft: "12px" }}>
                  Organisme responsable trouvé : {result.gestionnaire.siret}
                  <br />
                  <br />
                  Cet organisme recevra les vœux exprimés pour les établissements d'accueil suivants :
                  <Table>
                    <Thead>
                      <Tr>
                        <Td>UAI</Td>
                        <Td>LIBELLE_TYPE_ETABLISSEMENT</Td>
                        <Td>LIBELLE_ETABLISSEMENT</Td>
                        <Td>ADRESSE</Td>
                        <Td>CP</Td>
                        <Td>COMMUNE</Td>
                        <Td>TÉLÉCHARGEMENT DES VŒUX</Td>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.formateurs?.map((formateur, index) => {
                        return (
                          <Tr key={index}>
                            <Td>{formateur.uai}</Td>
                            <Td>{formateur.libelle_type_etablissement}</Td>
                            <Td>{formateur.libelle_etablissement}</Td>
                            <Td>{formateur.adresse}</Td>
                            <Td>{formateur.cp}</Td>
                            <Td>{formateur.commune}</Td>
                            <Td>{getDownloadStatus(result.gestionnaire, formateur)}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </div>
              </React.Fragment>
            ))}

          {/* TODO :
                    Si Siret non trouvé :
                    [message à rédiger + tard] */}
        </CardBody>
      </Card>
      <br />

      <Card>
        <CardHeader>
          <Heading as="h3" size="sm">
            2/ vous êtes un établissement d’accueil et vous souhaitez savoir quel organisme responsable va recevoir la
            liste des vœux exprimés sur le service en ligne Affelnet ?
          </Heading>
        </CardHeader>
        <CardBody>
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
                <Form style={{ width: "80%", margin: "auto" }}>
                  <Stack direction="row">
                    <Field name="search">
                      {({ field, meta }) => {
                        return (
                          <Input
                            placeholder="Rechercher un UAI, un libellé établissement (tel que figurant sur Affelnet)"
                            style={{ margin: 0 }}
                            {...field}
                          />
                        );
                      }}
                    </Field>
                    <Button variant="primary" type="submit">
                      Rechercher
                    </Button>
                  </Stack>

                  {formateurError && (
                    <ErrorMessage>
                      L'établissement n'a pas été trouvé. Vous pouvez relancer une nouvelle recherche avec un autre
                      paramètre.
                    </ErrorMessage>
                  )}
                </Form>
              );
            }}
          </Formik>

          {formateurData &&
            formateurData.map((result, index) => (
              <React.Fragment key={index}>
                <br />
                <div style={{ borderLeft: "2px solid black", paddingLeft: "12px" }}>
                  Etablissement d'accueil trouvé : {result.formateur.uai}
                  <br />
                  <br />
                  Cet établissement d'accueil devra contacter l'organisme gestionnaire suivant afin de récupérer la
                  liste des vœux exprimés :
                  <Table>
                    <Thead>
                      <Tr>
                        <Td>SIRET</Td>
                        <Td>UAI</Td>
                        <Td>RAISON SOCIALE</Td>
                        <Td>ADRESSE</Td>

                        <Td>MAIL</Td>
                        <Td>STATUT</Td>
                        <Td>TÉLÉCHARGEMENT DES VŒUX</Td>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>{result.gestionnaire.siret}</Td>
                        <Td>{result.gestionnaire.uai}</Td>
                        <Td>{result.gestionnaire.raison_sociale}</Td>
                        <Td>{result.gestionnaire.adresse.label}</Td>

                        <Td>{result.gestionnaire.email}</Td>
                        <Td>{result.gestionnaire.statut}</Td>
                        <Td>{getDownloadStatus(result.gestionnaire, result.formateur)}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </div>
              </React.Fragment>
            ))}

          {/* TODO :
                    Si on pouvait avoir un second encart dans lequel on indique à ce moment-là et selon le cas :

                    1/ Cet UAI n’est pas référencé sur le service en ligne Affelnet pour la campagne 2022, n’hésitez pas à vous rapprocher de votre Carif-Oref pour déclarer votre offre de formation
                    2/ À ce stade aucun vœu n’a été exprimé pour cet établissement d'accueil. La transmission de listes de vœux s’effectuera en 3 temps : dans la semaine du 6 juin, dans la semaine du 20 juin et dans la semaine du 4 juillet. M, merci pour votre patience
                    3/ Des vœux ont été téléchargés pour votre UAI établissement d'accueil par l’organisme  responsable (Siret : {Siret}), le {JJ/MM/AAAA}.
                    C’est l’établissement responsable qui est chargé de vous transmettre la liste correspondant à votre établissement. Vous pouvez vous rapprocher de votre établissement responsable pour vous assurer que la liste vous sera bien transmise dans les meilleurs délais. nous vous invitons à le contacter afin que cette liste puisse vous être transmise
                    4/ Des vœux sont disponibles pour téléchargement par l’établissement responsable (Siret : {Siret}), depuis le JJ/MM/AAAA. Vous pouvez vous rapprocher de votre établissement responsable pour vous assurer que la liste vous sera bien transmise dans les meilleurs délaisun délai raisonnable., nous vous invitons à le contacter afin qu’il puisse entamer les démarches nécessaires (confirmation mail et activation de compte) et que cette liste puisse vous être transmise */}
        </CardBody>
      </Card>
    </Page>
  );
}

export default ReceptionVoeuxPage;
