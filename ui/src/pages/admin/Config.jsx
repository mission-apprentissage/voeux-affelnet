import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { flushSync } from "react-dom";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  useToast,
  Switch,
  UnorderedList,
  ListItem,
  Text,
  FormHelperText,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import { _get, _put } from "../../common/httpClient";
import useAuth from "../../common/hooks/useAuth";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import { Page } from "../../common/components/layout/Page";
import { isAdmin } from "../../common/utils/aclUtils";

const configMap = new Map([
  [
    "diffusion",
    {
      label: "Activer la phase de diffusion",
      description: (
        <>
          <Text>
            Activer la phase de diffusion des candidatures aura les effets suivants :
            <UnorderedList>
              <ListItem>
                Les directeurs d'établissement ainsi que les délégués auront la possibilité de se connecter à
                l'application.
              </ListItem>
              <ListItem>
                Les modifications apportées par les chargés de mission généreront des envois de courriel de
                notification.
              </ListItem>
            </UnorderedList>
          </Text>
        </>
      ),
    },
  ],
]);

export const Config = () => {
  const [options, setOptions] = useState({});

  const toast = useToast();
  const [auth] = useAuth();
  const mountedRef = useRef(true);

  const getOptions = useCallback(async () => {
    try {
      const data = await _get("/api/config");
      // console.log(data);
      setOptions(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      if (mountedRef.current) {
        await getOptions();
      }
    };
    run();

    return () => {
      mountedRef.current = false;
    };
  }, [getOptions]);

  const { handleSubmit, setFieldValue } = useFormik({
    initialValues: options,
    allowReinitialize: true,
    onSubmit: (values, { setSubmitting }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const result = await _put("/api/admin/config", values);
          if (result) {
            toast({ description: "La configuration a été mise à jour." });
          }
          await getOptions();
        } catch (e) {
          console.error(e);
          toast({
            description: "Une erreur est survenue lors de la mise à jour de la configuration.",
            status: "error",
          });
        }

        setSubmitting(false);
        resolve("onSubmitHandler complete");
      });
    },
  });

  if (!isAdmin(auth)) {
    return (
      <>
        <Breadcrumb items={[{ label: "Configuration de l'application", url: "/admin/config" }]} />
        <Page title="Accès refusé">Vous n'avez pas les droits suffisants pour accéder à cette page.</Page>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Configuration de l'application", url: "/admin/config" }]} />

      <Page title={"Configuration de l'application"}>
        {!!configMap.size && (
          <>
            <Heading as="h3" size="md" mb={4}>
              Liste des options :
            </Heading>

            <Box>
              {[...configMap.entries()].map(([key, option]) => (
                <Fragment key={key}>
                  <FormControl key={key} name={key} alignItems="center">
                    <Box display="flex" justifyContent="space-between">
                      <FormLabel>{option.label}</FormLabel>
                      <Switch
                        size="md"
                        m="auto"
                        isChecked={options[key]}
                        onChange={() => {
                          flushSync(() => {
                            setFieldValue(key, !options[key]);
                          });
                          void handleSubmit();
                        }}
                        aria-label={option.enabled ? "Désactiver" : "Activer"}
                      />
                    </Box>

                    <FormHelperText fontSize={"zeta"} color={"gray.500"}>
                      {option.description}
                    </FormHelperText>
                  </FormControl>
                </Fragment>
              ))}
            </Box>
          </>
        )}
      </Page>
    </>
  );
};
