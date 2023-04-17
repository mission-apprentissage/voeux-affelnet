import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Table,
  Tbody,
  Td,
  Thead,
  Th,
  Tr,
  MenuList,
  MenuItem,
  MenuButton,
  Menu,
  IconButton,
  Link,
  Select,
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import { Field, Form, Formik } from "formik";
import * as queryString from "query-string";

import { Pagination } from "../../../common/components/Pagination";
import SuccessMessage from "../../../common/components/SuccessMessage";
import ErrorMessage from "../../../common/components/ErrorMessage";
import { ErrorLine } from "../../../theme/components/icons";
import { Yup } from "../../../common/Yup";
import { _get, _put } from "../../../common/httpClient";
import { sortDescending } from "../../../common/utils/dateUtils";
import { GestionnaireLibelle } from "../../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { GestionnaireEmail } from "../../../common/components/gestionnaire/fields/GestionnaireEmail";

const iconProps = {
  width: "16px",
  height: "16px",
  margin: "auto",
  marginTop: "2px",
  display: "flex",
};

function getStatutVoeux(gestionnaire) {
  let statut;

  switch (true) {
    case !gestionnaire.etablissements?.find((e) => e.voeux_date):
      statut = "Pas de voeux";
      break;
    case !!gestionnaire.etablissements?.find((e) => e.voeux_date) && !gestionnaire.voeux_telechargements?.length:
      statut = "Pas encore téléchargés";
      break;

    case !!gestionnaire.etablissements?.find((e) => e.voeux_date) &&
      !!gestionnaire.etablissements?.find(
        (etablissement) =>
          etablissement?.voeux_date &&
          !gestionnaire?.voeux_telechargements
            ?.sort((a, b) => sortDescending(a.date, b.date))
            .find((v) => etablissement?.uai === v.uai && v.date > etablissement?.voeux_date)
      ):
      statut = "En partie téléchargés";
      break;
    case !!gestionnaire.etablissements?.find((e) => e.voeux_date) &&
      !gestionnaire.etablissements?.find(
        (etablissement) =>
          etablissement?.voeux_date &&
          !gestionnaire?.voeux_telechargements
            ?.sort((a, b) => sortDescending(a.date, b.date))
            .find((v) => etablissement?.uai === v.uai && v.date > etablissement?.voeux_date)
      ):
      statut = "Téléchargés";
      break;
    default:
      statut = "Inconnu";
      break;
  }
  return statut;
}

const Statut = ({ gestionnaire }) => {
  const [statut, setStatut] = useState(gestionnaire.statut);
  const [message, setMessage] = useState();

  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 2500);
    }
  }, [message]);

  const markAsNonConcerné = async () => {
    try {
      const { statut } = await _put(`/api/admin/gestionnaires/${gestionnaire.siret}/markAsNonConcerne`);
      setMessage(<SuccessMessage>L'établissement est désormais non concerné</SuccessMessage>);
      setStatut(statut);
    } catch (e) {
      console.error(e);
      setMessage(<ErrorMessage>Impossible de changer le statut de l'établissement</ErrorMessage>);
    }
  };

  const items =
    statut !== "non concerné"
      ? [
          {
            icon: <ErrorLine {...iconProps} />,
            value: "Marqué comme non concerné",
            onClick: markAsNonConcerné,
          },
        ]
      : [
          {
            value: "Pas d'actions disponibles",
            isDisabled: true,
          },
        ];

  return (
    <>
      <FormControl>
        <InputGroup isolation="none">
          <Input disabled={true} value={statut} />
          <InputRightElement width="40px">
            <Menu>
              <MenuButton
                as={(props) => <IconButton {...props} variant="ghost" borderRadius={0} padding={4} />}
                icon={<SettingsIcon />}
              ></MenuButton>
              <MenuList>
                {items.map((item, index) => (
                  <MenuItem key={index} onClick={item.onClick} icon={item.icon} isDisabled={item.isDisabled}>
                    {item.value}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      {message}
    </>
  );
};

// function Gestionnaire({ gestionnaire }) {
//   return (
//     <Card title={`gestionnaire ${gestionnaire.siret}`}>
//       <ul style={{ margin: "16px", listStyle: "none", paddingInlineStart: 0, maxWidth: "80vw" }}>
//         <li>
//           <b>Siret: </b> {gestionnaire.siret}
//         </li>
//         <li>
//           <b>Statut: </b> {gestionnaire.statut}
//         </li>
//         <li>
//           <b>Email: </b> {gestionnaire.email}
//         </li>
//         <li>
//           <b>Vœux: </b> {getStatutVoeux(gestionnaire)}
//         </li>
//         <li>
//           <b>Anciens emails: </b> {gestionnaire.anciens_emails?.map((ancien_email) => ancien_email.email).join(", ")}
//         </li>
//         <li>
//           <b>Établissement: </b>

//           <ul>
//             {gestionnaire.etablissements?.map((e) => (
//               <li>
//                 {e.uai}{" "}
//                 {e.voeux_date
//                   ? `- Derniers vœux reçus le ${toLocaleString(e.voeux_date)}${
//                       gestionnaire.voeux_telechargements.find((vt) => vt.uai === e.uai)
//                         ? `. Dernier téléchargement le ${toLocaleString(
//                             gestionnaire.voeux_telechargements
//                               .sort((a, b) => sortDescending(a.date, b.date))
//                               .find((vt) => vt.uai === e.uai).date
//                           )}`
//                         : ""
//                     }`
//                   : ""}
//               </li>
//             ))}
//           </ul>
//         </li>
//       </ul>
//     </Card>
//   );
// }

export const Gestionnaires = () => {
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const [query, setQuery] = useState();
  const [data, setData] = useState({
    gestionnaires: [],
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
      const data = await _get(`/api/admin/gestionnaires${params ? `?${params}` : ""}`);
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
    <Card mb={8}>
      <CardHeader>
        <Heading as="h3" size="md">
          Gestionnaires
        </Heading>
      </CardHeader>
      <CardBody>
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

                  <Field name="statut">
                    {({ field, meta }) => {
                      return <Select placeholder={"Statuts (tous)"} style={{ margin: 0 }} {...field} />;
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
              <Th width="100px"></Th>

              <Th width="400px">Raison sociale / Ville</Th>
              <Th width="450px">Courriel habilité à réceptionner les listes de vœux</Th>

              <Th width={"220px"}>Vœux 2023</Th>
              <Th width={"250px"}>Statut d'avancement</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading || data.gestionnaires.length === 0 ? (
              <Tr>
                <Td colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Td>
              </Tr>
            ) : (
              data.gestionnaires.map((gestionnaire) => {
                return (
                  <Tr key={gestionnaire.siret}>
                    <Td>
                      <Link variant="action" href={`/admin/gestionnaires/${gestionnaire.siret}`}>
                        Détail
                      </Link>
                    </Td>
                    <Td>
                      <GestionnaireLibelle gestionnaire={gestionnaire} />
                    </Td>
                    <Td>
                      <GestionnaireEmail gestionnaire={gestionnaire} />
                    </Td>
                    <Td>{getStatutVoeux(gestionnaire)}</Td>
                    <Td>
                      <Statut gestionnaire={gestionnaire} />
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
        <Box mt={4} mb={4} ml="auto" mr="auto">
          <Pagination pagination={data.pagination} onClick={(page) => search({ ...query, page })} />
        </Box>
      </CardBody>
    </Card>
  );
};

export default Gestionnaires;
