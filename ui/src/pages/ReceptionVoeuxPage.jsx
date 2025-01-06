import { useState } from "react";
import { Field, Form, Formik } from "formik";
import {
  Input,
  Button,
  Heading,
  Tbody,
  Td,
  Tr,
  Thead,
  Table,
  Stack,
  Box,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";

import { Yup } from "../common/Yup";
import { _get } from "../common/httpClient";
import ErrorMessage from "../common/components/ErrorMessage";
import { Page } from "../common/components/layout/Page";
import { FormateurLibelle } from "../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../common/components/responsable/fields/ResponsableLibelle";

// function getDownloadStatus(responsable, formateur) {
//   let statut;

//   console.log({ responsable, formateur });

//   if (!responsable || !formateur) {
//     return;
//   }

//   const etablissement = responsable.etablissements_formateur?.find((etab) => etab.uai === formateur?.uai);
//   const telechargements = responsable.voeux_telechargements_formateur
//     ?.sort((a, b) => sortDescending(a.date, b.date))
//     .filter((t) => t.uai === formateur?.uai);

//   console.log(formateur?.uai, {
//     etablissement,
//     telechargements,
//     telecharges: telechargements.find((v) => v.date > etablissement?.voeux_date),
//   });

//   switch (true) {
//     case !etablissement.voeux_date:
//       statut = "Pas de voeux";
//       break;
//     case !!etablissement.voeux_date && !telechargements?.length:
//       statut = "Pas encore téléchargés";
//       break;
//     case !!etablissement.voeux_date &&
//       !!telechargements.length &&
//       !telechargements.find((t) => t.date > etablissement?.voeux_date):
//       statut = "En partie téléchargés";
//       break;
//     case !!etablissement.voeux_date &&
//       !!telechargements.length &&
//       !!telechargements.find((t) => t.date > etablissement?.voeux_date):
//       statut = "Téléchargés";
//       break;
//     default:
//       statut = "Inconnu";
//       break;
//   }
//   return statut;
// }

function ReceptionVoeuxPage() {
  const [responsableData, setResponsableData] = useState(undefined);
  const [responsableError, setResponsableError] = useState(undefined);
  const [formateurData, setFormateurData] = useState(undefined);
  const [formateurError, setFormateurError] = useState(undefined);

  const submitResponsableSearch = async (value) => {
    try {
      setResponsableError(undefined);
      const data = await _get(`/api/relation/rechercheResponsable?search=${value.search}`);
      setResponsableData(data);
    } catch (e) {
      console.error(e);
      setResponsableData(undefined);
      setResponsableError(e);
    }
  };

  const submitFormateurSearch = async (value) => {
    try {
      setFormateurError(undefined);
      const data = await _get(`/api/relation/rechercheFormateur?search=${value.search}`);
      setFormateurData(data);
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
      <Accordion defaultIndex={[]} allowToggle mt={12}>
        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Heading as="h3" size="sm">
                Vous êtes un établissement responsable (signataire des conventions de formation) et vous souhaitez
                savoir pour quelles UAI d’accueil vous allez recevoir la liste des vœux exprimés sur le service en ligne
                Affelnet ?
              </Heading>
              <AccordionIcon />
            </AccordionButton>
          </h2>

          <AccordionPanel py={12}>
            <Box mb={12}>
              <Formik
                initialValues={{
                  search: "",
                }}
                validationSchema={Yup.object().shape({
                  search: Yup.string().required("Requis"),
                })}
                onSubmit={submitResponsableSearch}
              >
                {({ status = {} }) => {
                  return (
                    <Form style={{ width: "80%", margin: "auto" }}>
                      <Stack direction="row">
                        <Field name="search">
                          {({ field, meta }) => {
                            return (
                              <Input
                                placeholder="Rechercher un UAI, une raison sociale..."
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

                      {responsableError && (
                        <ErrorMessage>
                          L'établissement n'a pas été trouvé. Vous pouvez relancer une nouvelle recherche avec un autre
                          paramètre.
                        </ErrorMessage>
                      )}
                    </Form>
                  );
                }}
              </Formik>
            </Box>

            {responsableData && (
              <Box pl={8} mb={12}>
                Organisme responsable trouvé : <ResponsableLibelle responsable={responsableData.responsable} />
                <br />
                <br />
                Cet organisme recevra les vœux exprimés pour les établissements d'accueil suivants :
                <Table>
                  <Thead>
                    <Tr>
                      <Td>UAI</Td>
                      <Td>RAISON_SOCIALE</Td>
                      <Td>ADRESSE</Td>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {responsableData.formateurs?.map((formateur, index) => (
                      <Tr key={index}>
                        <Td>{formateur?.uai}</Td>
                        <Td>{formateur?.raison_sociale}</Td>
                        <Td>{formateur?.adresse}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Heading as="h3" size="sm">
                Vous êtes un établissement d’accueil et vous souhaitez savoir quel organisme responsable va recevoir la
                liste des vœux exprimés sur le service en ligne Affelnet ?
              </Heading>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel py={12}>
            <Box mb={12}>
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
                                placeholder="Rechercher un UAI, une raison sociale..."
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
            </Box>

            {formateurData && (
              <Box pl={8} mb={12}>
                Établissement d'accueil trouvé : <FormateurLibelle formateur={formateurData.formateur} />
                <br />
                <br />
                Cet établissement d'accueil dispense des formations pour les organismes responsables suivants :
                <Table>
                  <Thead>
                    <Tr>
                      <Td>UAI</Td>
                      <Td>RAISON_SOCIALE</Td>
                      <Td>ADRESSE</Td>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {formateurData.responsables?.map((responsable, index) => (
                      <Tr key={index}>
                        <Td>{responsable.uai}</Td>
                        <Td>{responsable.raison_sociale}</Td>
                        <Td>{responsable.adresse}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Page>
  );
}

export default ReceptionVoeuxPage;
