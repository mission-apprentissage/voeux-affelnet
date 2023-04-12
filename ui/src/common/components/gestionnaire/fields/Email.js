import React, { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  MenuList,
  MenuItem,
  MenuButton,
  Menu,
  IconButton,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon, SettingsIcon } from "@chakra-ui/icons";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";

import SuccessMessage from "../../SuccessMessage";
import ErrorMessage from "../../ErrorMessage";
import { _put } from "../../../httpClient";

import { SendPlaneLine } from "../../../../theme/components/icons/SendPlaneLine";
import { DraftLine } from "../../../../theme/components/icons/DraftLine";
import { ValidationModal } from "../../ValidationModal";

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

export const GestionnaireEmail = ({ gestionnaire }) => {
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
