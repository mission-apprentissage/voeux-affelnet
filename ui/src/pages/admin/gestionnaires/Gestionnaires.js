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
  Tr,
  MenuList,
  MenuItem,
  MenuButton,
  Menu,
  IconButton,
  Link,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import * as queryString from "query-string";
import * as Yup from "yup";
import { Pagination } from "../../../common/components/Pagination";
import SuccessMessage from "../../../common/components/SuccessMessage";
import ErrorMessage from "../../../common/components/ErrorMessage";
import { _get, _put } from "../../../common/httpClient";
import { sortDescending } from "../../../common/utils/dateUtils";
import { CheckIcon, CloseIcon, SettingsIcon } from "@chakra-ui/icons";
import { SendPlaneLine } from "../../../theme/components/icons/SendPlaneLine";
import { DraftLine } from "../../../theme/components/icons/DraftLine";
import { ErrorLine } from "../../../theme/components/icons";
import { ValidationModal } from "../../../common/components/ValidationModal";

const iconProps = {
  width: "16px",
  height: "16px",
  margin: "auto",
  marginTop: "2px",
  display: "flex",
};

function showError(meta, options = {}) {
  if (!meta.touched || !meta.error) {
    return {};
  }

  return {
    ...(options.noMessage ? {} : { feedback: meta.error }),
    invalid: true,
  };
}

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

const Email = ({ gestionnaire }) => {
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState();
  const [editedEmail, setEditedEmail] = useState(gestionnaire.email);

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const {
    isOpen: isResendConfirmationOpen,
    onOpen: onResendConfirmationOpen,
    onClose: onResendConfirmationClose,
  } = useDisclosure();
  const {
    isOpen: isResendActivationOpen,
    onOpen: onResendActivationOpen,
    onClose: onResendActivationClose,
  } = useDisclosure();
  const {
    isOpen: isResendNotificationOpen,
    onOpen: onResendNotificationOpen,
    onClose: onResendNotificationClose,
  } = useDisclosure();

  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 2500);
    }
  }, [message]);

  async function setEmail(email) {
    try {
      await _put(`/api/admin/gestionnaires/${gestionnaire.siret}/setEmail`, { email });
      setEdit(false);
      setMessage(<SuccessMessage>Email modifié</SuccessMessage>);
    } catch (e) {
      console.error(e);
      setMessage(<ErrorMessage>Une erreur est survenue</ErrorMessage>);
    }
  }

  async function resendConfirmationEmail() {
    try {
      const { sent } = await _put(`/api/admin/gestionnaires/${gestionnaire.siret}/resendConfirmationEmail`);
      setMessage(
        sent > 0 ? (
          <SuccessMessage>Email envoyé</SuccessMessage>
        ) : (
          <ErrorMessage>Impossible d'envoyer le message</ErrorMessage>
        )
      );
    } catch (e) {
      console.error(e);
    }
    return true;
  }

  async function resendActivationEmail() {
    try {
      const { sent } = await _put(`/api/admin/gestionnaires/${gestionnaire.siret}/resendActivationEmail`);
      setMessage(
        sent > 0 ? (
          <SuccessMessage>Email envoyé</SuccessMessage>
        ) : (
          <ErrorMessage>Impossible d'envoyer le message</ErrorMessage>
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function resendNotificationEmail() {
    try {
      const { sent } = await _put(`/api/admin/gestionnaires/${gestionnaire.siret}/resendNotificationEmail`);
      setMessage(
        sent > 0 ? (
          <SuccessMessage>Email envoyé</SuccessMessage>
        ) : (
          <ErrorMessage>Impossible d'envoyer le message</ErrorMessage>
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  const items = [
    {
      icon: <DraftLine {...iconProps} />,
      value: "Modifier l'email",
      onClick: () => setEdit(true),
    },
    ...(gestionnaire.statut === "en attente"
      ? [
          {
            icon: <SendPlaneLine {...iconProps} />,
            value: "Renvoyer l'email de confirmation",
            onClick: onResendConfirmationOpen,
          },
        ]
      : []),
    ...(gestionnaire.statut === "confirmé" && gestionnaire.etablissements?.find((e) => e.voeux_date)
      ? [
          {
            icon: <SendPlaneLine {...iconProps} />,
            value: "Renvoyer l'email d'activation",
            onClick: onResendActivationOpen,
          },
        ]
      : []),
    ...(gestionnaire.statut === "activé" && gestionnaire.etablissements?.find((e) => e.voeux_date)
      ? [
          {
            icon: <SendPlaneLine {...iconProps} />,
            value: "Renvoyer l'email de notification",
            onClick: onResendNotificationOpen,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Modal de validation de renvoie du mail de confirmation*/}
      <ValidationModal
        isOpen={isResendConfirmationOpen}
        onClose={onResendConfirmationClose}
        callback={resendConfirmationEmail}
      >
        <Text>L'opération va renvoyer un mail de confirmation à l'adresse {gestionnaire.email}</Text>
        <Text>Souhaitez-vous procéder ?</Text>
      </ValidationModal>

      {/* Modal de validation de renvoie du mail de confirmation*/}
      <ValidationModal
        isOpen={isResendActivationOpen}
        onClose={onResendActivationClose}
        callback={resendActivationEmail}
      >
        <Text>L'opération va renvoyer un mail d'activation à l'adresse {gestionnaire.email}</Text>
        <Text>Souhaitez-vous procéder ?</Text>
      </ValidationModal>

      {/* Modal de validation de renvoie du mail de confirmation*/}
      <ValidationModal
        isOpen={isResendNotificationOpen}
        onClose={onResendNotificationClose}
        callback={resendNotificationEmail}
      >
        <Text>L'opération va renvoyer un mail de notification à l'adresse {gestionnaire.email}</Text>
        <Text>Souhaitez-vous procéder ?</Text>
      </ValidationModal>

      {/* Modal de validation de l'édition de l'email */}
      <ValidationModal isOpen={isEditOpen} onClose={onEditClose} callback={() => setEmail(editedEmail)}>
        <Text>Modifier une adresse mail ....</Text>
        <Text>Souhaitez-vous procéder ?</Text>
      </ValidationModal>

      <Formik
        initialValues={{
          email: gestionnaire.email,
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email(),
        })}
        onSubmit={(values) => {
          setEditedEmail(values.email);
          onEditOpen();
        }}
      >
        {({ status = {} }) => {
          return (
            <Form>
              <Field name="email">
                {({ field, meta }) => {
                  return (
                    <FormControl>
                      <InputGroup isolation="none">
                        <Input disabled={!edit} {...field} {...showError(meta, { noMessage: true })} />

                        {edit ? (
                          <InputRightElement width={20}>
                            <>
                              <Button variant="primary" type={"submit"}>
                                <CheckIcon />
                              </Button>
                              <Button variant="secondary" onClick={() => setEdit(false)}>
                                <CloseIcon />
                              </Button>
                            </>
                          </InputRightElement>
                        ) : (
                          <InputRightElement width={10}>
                            <Menu>
                              <MenuButton
                                as={(props) => <IconButton {...props} variant="ghost" borderRadius={0} padding={4} />}
                                icon={<SettingsIcon />}
                              ></MenuButton>
                              <MenuList>
                                {items.map((item, index) => (
                                  <MenuItem key={index} onClick={item.onClick} icon={item.icon}>
                                    {item.value}
                                  </MenuItem>
                                ))}
                              </MenuList>
                            </Menu>
                          </InputRightElement>
                        )}
                      </InputGroup>
                    </FormControl>
                  );
                }}
              </Field>
              {status.error && <ErrorMessage>{status.error}</ErrorMessage>}
              {message}
            </Form>
          );
        }}
      </Formik>
    </>
  );
};

const Statut = ({ gestionnaire }) => {
  const [statut, setStatut] = useState(gestionnaire.statut);
  const [message, setMessage] = useState();
  // const { onOpen } = useDisclosure();

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
      {/*
      <ValidationModal callback={markAsNonConcerné} title="Marqué comme non concerné">
        Souhaitez-vous procéder ?
      </ValidationModal> */}
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

const Gestionnaires = () => {
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
              <Form>
                <Box style={{ display: "inline-flex", width: "100%" }}>
                  <Field name="text">
                    {({ field, meta }) => {
                      return (
                        <Input
                          placeholder={"Rechercher un siret, raison sociale, académie, email, statut"}
                          style={{ margin: 0 }}
                          {...field}
                        />
                      );
                    }}
                  </Field>
                  <Button variant="primary" type="submit">
                    Rechercher
                  </Button>
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
              <Td width={"150px"}>Siret</Td>
              <Td width={"250px"}>Statut</Td>
              <Td>Email</Td>
              <Td width={"220px"}>Voeux</Td>
              <Td width={"150px"}></Td>
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
                    <Td>{gestionnaire.siret}</Td>
                    <Td>
                      <Statut gestionnaire={gestionnaire} />
                    </Td>
                    <Td>
                      <Email gestionnaire={gestionnaire} />
                    </Td>
                    <Td>{getStatutVoeux(gestionnaire)}</Td>
                    <Td>
                      <Link variant="slight" size="sm" href={`/admin/gestionnaires/${gestionnaire.siret}`}>
                        Voir le détail
                      </Link>
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
