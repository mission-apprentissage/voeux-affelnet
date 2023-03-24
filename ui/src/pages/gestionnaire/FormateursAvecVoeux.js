import { FormateurLibelle } from "../../common/components/fields/formateur/Libelle";
import { useCallback, useState } from "react";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { Button, Input, Link, Table, Tbody, Td, Th, Thead, Tr, Text, Flex } from "@chakra-ui/react";

import { downloadCSV } from "../../common/utils/downloadUtils";
import { getHeaders } from "../../common/httpClient";

const FormateurVoeuxDisponibles = (gestionnaire, formateur, callback) => {
  // const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  // const diffusionAutorisee = etablissement?.diffusionAutorisee;

  // // TODO :
  // const voeuxDisponible = 4

  // const
  return <>0</>;
};

const FormateurStatut = ({ gestionnaire, formateur, callback }) => {
  console.log("FormateurStatut", formateur);

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  // TODO :
  const voeuxDisponible = 4;

  console.log(formateur);

  const downloadVoeux = useCallback(async () => {
    const filename = `${formateur.uai}.csv`;
    const content = await fetch(`/api/gestionnaire/formateurs/${filename}`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, [formateur]);

  // const
  return (
    <>
      {diffusionAutorisee ? (
        <></>
      ) : (
        <>
          {voeuxDisponible ? (
            <Button variant="primary" onClick={downloadVoeux}>
              Télécharger
            </Button>
          ) : (
            <>Pas de vœux disponibles</>
          )}
        </>
      )}
    </>
  );
};

const FormateurEmail = ({ gestionnaire, formateur, callback }) => {
  console.log("FormateurEmail", formateur);

  // const [enableForm, setEnableForm] = useState(false);

  // const setEtablissementEmail = useCallback(async ({ values, etablissement }) => {
  //   try {
  //     await _put(`/api/gestionnaire/formateurs/${etablissement.uai}`, { email: values.email });
  //     setEnableForm(false);
  //     callback();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // });

  const etablissement = gestionnaire.etablissements?.find((etablissement) => formateur.uai === etablissement.uai);

  const diffusionAutorisee = etablissement?.diffusionAutorisee;

  const isResponsableFormateur = formateur.siret === gestionnaire.siret;

  return (
    <>
      {diffusionAutorisee ? (
        <Text>{etablissement.email}</Text>
      ) : (
        <Flex alignItems="center">
          <Text mr={4}>
            <strong>Vous</strong> ({gestionnaire.email})
          </Text>
          {!isResponsableFormateur && <Button variant="primary">Déléguer</Button>}
        </Flex>
      )}
    </>
  );

  // return (
  //   <>
  //     {!etablissement.email || enableForm ? (
  //       <Formik
  //         initialValues={{
  //           email: etablissement.email, // formateur.mel ?
  //         }}
  //         validationSchema={Yup.object().shape({
  //           email: Yup.string().required("Requis"),
  //         })}
  //         onSubmit={(form) => setEtablissementEmail({ form, etablissement })}
  //       >
  //         <Form style={{ display: "inline-flex", width: "100%" }}>
  //           <Field name="email">
  //             {({ field, meta }) => {
  //               return (
  //                 <Input
  //                   type="email"
  //                   role="presentation"
  //                   placeholder="Renseigner l'email"
  //                   style={{ margin: 0 }}
  //                   {...field}
  //                 />
  //               );
  //             }}
  //           </Field>
  //           <Button variant="primary" type="submit">
  //             OK
  //           </Button>
  //         </Form>
  //       </Formik>
  //     ) : (
  //       <>
  //         {etablissement.email}{" "}
  //         <Link fontSize={"zeta"} textDecoration={"underline"} onClick={() => setEnableForm(true)}>
  //           Modifier
  //         </Link>
  //       </>
  //     )}
  //   </>
  // );
};

export const FormateursAvecVoeux = ({ gestionnaire, formateurs, updateCallback }) => {
  console.log("FormateursAvecVoeux", formateurs);

  return (
    <Table mt={12}>
      <Thead>
        <Tr>
          <Th width="100px"></Th>
          <Th width="400px">Raison sociale / Ville</Th>
          <Th width="450px">Courriel habilité</Th>
          <Th>Vœux 2023</Th>
          <Th>Statut d'avancement</Th>
        </Tr>
      </Thead>
      <Tbody>
        {formateurs.map((formateur) => {
          return (
            <Tr key={formateur?.uai}>
              <Td>
                <Link variant="action" href={`/gestionnaire/formateurs/${formateur.uai}`}>
                  Détail
                </Link>
              </Td>
              <Td>
                <FormateurLibelle formateur={formateur} />
              </Td>
              <Td>
                <FormateurEmail gestionnaire={gestionnaire} formateur={formateur} callback={updateCallback} />
              </Td>
              <Td>
                <FormateurVoeuxDisponibles gestionnaire={gestionnaire} formateur={formateur} />
              </Td>
              <Td>
                <FormateurStatut gestionnaire={gestionnaire} formateur={formateur} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
