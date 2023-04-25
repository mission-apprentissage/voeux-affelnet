import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Text, Link, Heading, Box, Alert } from "@chakra-ui/react";

import { _get } from "../../../common/httpClient";
import { Page } from "../../../common/components/layout/Page";
import { FormateurLibelle } from "../../../common/components/formateur/fields/FormateurLibelle";
import { isResponsableFormateur } from "../../../common/utils/getUserType";
import { useDownloadVoeux } from "../../../common/hooks/adminHooks";

// const EtablissementEmail = ({ gestionnaire, etablissement, callback }) => {
//   const [enableForm, setEnableForm] = useState(false);

//   const setEtablissementEmail = useCallback(async ({ form, etablissement }) => {
//     try {
//       await _put(`/api/gestionnaire/formateurs/${etablissement.uai}`, { email: form.email, diffusionAutorisee: true });
//       setEnableForm(false);
//       callback();
//     } catch (error) {
//       console.error(error);
//     }
//   });

//   return (
//     <>
//       {!etablissement.email || enableForm ? (
//         <Formik
//           initialValues={{
//             email: etablissement.email, // formateur.mel ?
//           }}
//           validationSchema={Yup.object().shape({
//             email: Yup.string().required("Requis"),
//           })}
//           onSubmit={(form) => setEtablissementEmail({ form, etablissement })}
//         >
//           <Form style={{ display: "inline-flex", width: "100%" }}>
//             <Field name="email">
//               {({ field, meta }) => {
//                 return (
//                   <Input
//                     type="email"
//                     role="presentation"
//                     placeholder="Renseigner l'email"
//                     style={{ margin: 0 }}
//                     {...field}
//                   />
//                 );
//               }}
//             </Field>
//             <Button variant="primary" type="submit">
//               OK
//             </Button>
//           </Form>
//         </Formik>
//       ) : (
//         <>
//           {etablissement.email}{" "}
//           <Link fontSize={"zeta"} textDecoration={"underline"} onClick={() => setEnableForm(true)}>
//             Modifier
//           </Link>
//         </>
//       )}
//     </>
//   );
// };

export const Formateur = () => {
  const { siret, uai } = useParams();
  const downloadVoeux = useDownloadVoeux();
  const [gestionnaires, setGestionnaires] = useState(undefined);
  const [formateur, setFormateur] = useState(undefined);
  const mounted = useRef(false);

  const getGestionnaire = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/gestionnaires/${siret}`);
      setGestionnaires([response]);
    } catch (error) {
      setGestionnaires(undefined);
      throw Error;
    }
  }, [siret]);

  const getGestionnaires = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/formateurs/${uai}/gestionnaires`);
      setGestionnaires(response);
    } catch (error) {
      setGestionnaires(undefined);
      throw Error;
    }
  }, [uai]);

  const getFormateur = useCallback(async () => {
    try {
      const response = await _get(`/api/admin/formateurs/${uai}`);

      setFormateur(response);
    } catch (error) {
      setFormateur(undefined);
      throw Error;
    }
  }, [uai]);

  useEffect(() => {
    const run = async () => {
      if (!mounted.current) {
        await getFormateur();
        if (siret) {
          await getGestionnaire();
        } else {
          await getGestionnaires();
        }
        mounted.current = true;
      }
    };
    run();
  }, [siret, getGestionnaires, getGestionnaire, getFormateur]);

  if (!formateur || !gestionnaires?.[0]) {
    return;
  }

  const hasOnlyOneResponsable = gestionnaires.length === 1;

  // TODO : Gérer le multi-responsable
  const gestionnaire = gestionnaires[0];

  const isResponsableFormateurCheck = isResponsableFormateur({
    gestionnaire,
    formateur,
  });

  const etablissement = gestionnaire?.etablissements?.find((etablissement) => etablissement.uai === formateur.uai);

  const isDiffusionAutorisee = !!etablissement?.diffusionAutorisee;

  return (
    <Page
      title={
        <>
          Organisme {isResponsableFormateurCheck ? <>responsable-formateur</> : <>formateur</>} :&nbsp;
          <FormateurLibelle formateur={formateur} />
        </>
      }
    >
      {!hasOnlyOneResponsable && (
        <Alert status="error">
          Plusieurs responsables ont été trouvés pour cet organisme, seules les informations liées à un seul de ces
          responsables sont listées ici. Merci de contacter le support.
        </Alert>
      )}

      <Box my={6}>
        <Text mb={4}>
          Adresse : {formateur.adresse} {formateur.cp} {formateur.commune} – Siret : {formateur.siret ?? "Inconnu"} –
          UAI : {formateur.uai ?? "Inconnu"}
        </Text>
      </Box>

      {isResponsableFormateurCheck ? (
        <Box mb={12}>
          <Text mb={4}>
            Cet organisme formateur est également responsable (signataire des conventions de formation), directement
            habilité à accéder aux listes de candidats. Personne habilitée à réceptionner les listes :{" "}
            {gestionnaires[0]?.email}.{" "}
          </Text>

          {/* <UpdateGestionnaireEmailModal
            isOpen={isOpenUpdateGestionnaireEmailModal}
            onClose={onCloseUpdateGestionnaireEmailModal}
            callback={callback}
            gestionnaire={gestionnaire}
          /> */}
        </Box>
      ) : (
        <Box mb={12}>
          <Alert status="info" variant="left-accent" my={6}>
            <Box>
              <Text mb={2}>
                <Text as="b" style={{ textDecoration: "underline" }}>
                  Organisme responsable
                </Text>{" "}
                : {gestionnaire?.raison_sociale}
              </Text>
              <Text mb={2}>
                Adresse : {gestionnaire?.adresse ?? "Inconnue"} – Siret : {gestionnaire?.siret ?? "Inconnu"} – UAI :{" "}
                {gestionnaire?.uai ?? "Inconnu"}
              </Text>
              <Text mb={2}>
                Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
                {gestionnaire?.email}
              </Text>
              <Text mb={2}>
                <Link variant="action" href={`/admin/gestionnaire/${gestionnaire?.siret}  `}>
                  Accéder à la page de l'organisme responsable
                </Link>
              </Text>
              <Text mb={2}>
                <Link variant="action" href={`/admin/gestionnaire/${gestionnaire?.siret}/formateurs`}>
                  Accéder à la liste des formateurs dépendants de cet organisme responsable
                </Link>
              </Text>
            </Box>
          </Alert>

          {isDiffusionAutorisee ? (
            <>
              <Text>
                La délégation des droits de réception des listes de candidats a été activée pour cet organisme
                formateur. Personne habilitée à réceptionner les listes au sein de l'organisme formateur :{" "}
                {formateur?.email ?? etablissement?.email}{" "}
                {/* <Link variant="action" onClick={onOpenUpdateDelegationModal}>
                  (modifier)
                </Link> */}
              </Text>

              {/* <UpdateDelegationModal
                gestionnaire={gestionnaire}
                formateur={formateur}
                callback={callback}
                isOpen={isOpenUpdateDelegationModal}
                onClose={onCloseUpdateDelegationModal}
              /> */}
            </>
          ) : (
            <>
              <Text mb={4}>
                La délégation des droits de réception des listes de candidats n'a pas été activée pour cet organisme
                formateur. Seul le responsable peut les réceptionner.
              </Text>
              {/* <Button variant="primary" mb={4} onClick={onOpenDelegationModal}>
                Définir une délégation de droits pour cet organisme
              </Button> */}

              {/* <DelegationModal
                gestionnaire={gestionnaire}
                formateur={formateur}
                callback={callback}
                isOpen={isOpenDelegationModal}
                onClose={onCloseDelegationModal}
              /> */}
            </>
          )}
        </Box>
      )}

      <Box mb={12} id="statut">
        <Heading as="h3" size="md" mb={4}>
          Statut
        </Heading>

        <Heading as="h4" size="sm" mb={4}>
          Nombre de candidats: {gestionnaire.nombre_voeux ?? formateur.nombre_voeux}
        </Heading>

        <Link variant="action" onClick={() => downloadVoeux({ gestionnaire, formateur })}>
          Télécharger la liste
        </Link>
      </Box>

      <Box mb={12}>
        <Heading as="h3" size="md" mb={4}>
          Historique des actions
        </Heading>
        {/* <List>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
          </List> */}
      </Box>

      <Box mb={12}>
        <Link href="/anomalie" variant="action">
          Signaler une anomalie
        </Link>
      </Box>
    </Page>
  );
};

export default Formateur;
