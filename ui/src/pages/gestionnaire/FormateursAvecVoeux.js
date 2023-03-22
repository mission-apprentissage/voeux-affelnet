import { FormateurLibelle } from "../../common/components/fields/formateur/Libelle";
import { useCallback, useState } from "react";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { Button, Input, Link, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";

import { _put } from "../../common/httpClient";

const EtablissementEmail = ({ gestionnaire, etablissement, callback }) => {
  const [enableForm, setEnableForm] = useState(false);

  const setEtablissementEmail = useCallback(async ({ form, etablissement }) => {
    try {
      await _put(`/api/gestionnaire/formateurs/${etablissement.uai}`, { email: form.email });
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

export const FormateursAvecVoeux = ({ gestionnaire, formateurs, updateCallback }) => {
  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th width="375px">Couriel habilité</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
          const etablissement = gestionnaire.formateurs.find((etablissement) => etablissement.uai === formateur.uai);
          return (
            <Tr key={formateur?.uai}>
              <Td>
                <Link variant="popup">Détail&nbsp;</Link>
              </Td>
              <Td>
                <FormateurLibelle formateur={formateur} />
              </Td>
              <Td>
                <EtablissementEmail
                  gestionnaire={gestionnaire}
                  etablissement={etablissement}
                  callback={updateCallback}
                />
              </Td>
              <Td>{etablissement.email ? "<STATUT PLACEHOLDER>" : <Link variant="popup">Anomalie ?</Link>}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
