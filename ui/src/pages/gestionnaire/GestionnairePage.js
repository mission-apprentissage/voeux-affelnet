import React, { useState, useEffect, useRef, useCallback } from "react";
import { Route, Routes } from "react-router-dom";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { Button, Text, Input, Radio, Stack, Table, Thead, Tbody, Tr, Th, Td, Link, Container } from "@chakra-ui/react";

import { _get, _put } from "../../common/httpClient";
import { Page } from "../../common/components/layout/Page";

import { FormateursAvecVoeux } from "./FormateursAvecVoeux";
import { FormateursSansVoeux } from "./FormateursSansVoeux";
import { Formateur } from "./Formateur";

const GestionnairePage = () => {
  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const mounted = useRef(false);

  // console.log(gestionnaire);
  // console.log(formateurs);

  const getGestionnaire = useCallback(async () => {
    try {
      const response = await _get("/api/gestionnaire");
      setGestionnaire(response);
    } catch (error) {
      setGestionnaire(undefined);
      throw Error;
    }
  });

  const getFormateurs = useCallback(async () => {
    try {
      const response = await _get("/api/gestionnaire/formateurs");
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

  if (!gestionnaire) {
    return;
  }

  const avecVoeux = false;

  return (
    <>
      <Routes>
        <Route
          exact
          path="/formateurs/:uai"
          element={<Formateur gestionnaire={gestionnaire} formateurs={formateurs} />}
        />
        <Route
          exact
          path="/"
          element={
            <Page title={"Définir les modalités de réception des listes de vœux Affelnet"}>
              <Text as="b" mb={4}>
                Voici la listes des organismes formateurs pour lesquels vous êtes identifié comme responsable. Vous
                aurez prochainement la possibilité sur ce même écran de télécharger les listes de vœux exprimés via le
                service en ligne Affelnet.
              </Text>

              <Text fontStyle="italic">
                Nouveauté pour 2023 : vous avez maintenant la possibilité de déléguer les droits de réception des listes
                de vœux aux organismes dont vous êtes responsable. En cas de délégation de droits, vous conserverez un
                accès à l'ensemble des listes de vœux, et vous pourrez visualiser les statuts d'avancement de chaque
                établissement.
              </Text>

              {formateurs && avecVoeux && (
                <FormateursAvecVoeux
                  gestionnaire={gestionnaire}
                  formateurs={formateurs}
                  updateCallback={getGestionnaire}
                />
              )}

              {formateurs && !avecVoeux && (
                <FormateursSansVoeux
                  gestionnaire={gestionnaire}
                  formateurs={formateurs}
                  updateCallback={getGestionnaire}
                />
              )}
            </Page>
          }
        />
      </Routes>
    </>
  );
};

export default GestionnairePage;
