import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { Button, Text, Input, Radio, Stack, Table, Thead, Tbody, Tr, Th, Td, Link, Container } from "@chakra-ui/react";

import { _get, _put } from "../common/httpClient";
import { Page } from "../common/components/layout/Page";

import { FormateursAvecVoeux } from "./gestionnaire/FormateursAvecVoeux";
import { FormateursSansVoeux } from "./gestionnaire/FormateursSansVoeux";

const GestionnairePage = () => {
  const [gestionnaire, setGestionnaire] = useState(undefined);
  const [formateurs, setFormateurs] = useState(undefined);
  const mounted = useRef(false);

  console.log(gestionnaire);
  console.log(formateurs);

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

  // const setDiffusionAutorisee = useCallback(async (bool) => {
  //   try {
  //     const response = await _put(`/api/gestionnaire`, { diffusionAutorisee: bool });
  //     setGestionnaire(response);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // });

  if (!gestionnaire) {
    return;
  }

  const avecVoeux = true;

  return (
    <Page title={"Définir les modalités de réception des listes de vœux Affelnet"}>
      <Text as="b">
        Voici la listes des organismes formateurs pour lesquels vous êtes identifié comme responsable. Vous aurez
        prochainement la possibilité sur ce même écran de télécharger les listes de vœux exprimés via le service en
        ligne Affelnet.
      </Text>
      <br />
      <br />
      <Text mt={4} as="i">
        Nouveauté pour 2023 : vous avez maintenant la possibilité de déléguer les droits de réception des listes de vœux
        aux organismes dont vous êtes responsable. En cas de délégation de droits, vous conserverez un accès à
        l'ensemble des listes de vœux, et vous pourrez visualiser les statuts d'avancement de chaque établissement.
      </Text>
      {/*
      <Stack mt={8}>
        <Radio
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
            J'autorise la diffusion des listes de vœux directement aux organismes formateurs listés ci-dessous. Je
            garderai la possibilité de télécharger les listes, et j'aurai accès à une console de suivi des
            téléchargements par les organismes formateurs.
          </Text>
        </Radio>
        <Radio
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
            Je n'autorise pas la diffusion des listes des vœux directement aux organismes formateurs listés ci-dessous.
            J'en serais seul destinataire, et je serais en charge de les transmettre par d'autres moyens.
          </Text>
        </Radio>
      </Stack> */}

      {formateurs && avecVoeux && (
        <FormateursAvecVoeux gestionnaire={gestionnaire} formateurs={formateurs} updateCallback={getGestionnaire} />
      )}

      {formateurs && !avecVoeux && (
        <FormateursSansVoeux gestionnaire={gestionnaire} formateurs={formateurs} updateCallback={getGestionnaire} />
      )}
    </Page>
  );
};

export default GestionnairePage;
