import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  useToast,
  Text,
  FormHelperText,
  Badge,
  Input,
  Flex,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Button,
  Divider,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { Field, Formik } from "formik";
import { _delete, _get, _post, _put } from "../../common/httpClient";
import useAuth from "../../common/hooks/useAuth";
import { Breadcrumb } from "../../common/components/Breadcrumb";
import { Page } from "../../common/components/layout/Page";
import { isAdmin } from "../../common/utils/aclUtils";
import { USER_TYPE } from "../../common/constants/UserType";
import { USER_STATUS } from "../../common/constants/UserStatus";
import { useGet } from "../../common/hooks/httpHooks";

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [academies] = useGet("/api/constant/academies", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchAcademie, setSearchAcademie] = useState("");

  const typeOptions = [
    {
      value: USER_TYPE.ADMIN,
      label: (
        <Badge p={1} colorScheme="red">
          {USER_TYPE.ADMIN}
        </Badge>
      ),
    },
    {
      value: USER_TYPE.ACADEMIE,
      label: (
        <Badge p={1} colorScheme="blue">
          {USER_TYPE.ACADEMIE}
        </Badge>
      ),
    },
  ];

  const academiesOptions = academies?.map((academie) => ({
    value: academie.code,
    label: <Badge p={1}>{academie.nom}</Badge>,
  }));

  const toast = useToast();
  const [auth] = useAuth();
  const mountedRef = useRef(true);

  const getUsers = useCallback(async () => {
    try {
      const data = await _get("/api/admin/users");
      // console.log(data);
      setUsers(data?.users);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      if (mountedRef.current) {
        await getUsers();
      }
    };
    run();

    return () => {
      mountedRef.current = false;
    };
  }, [getUsers]);

  // const { handleSubmit, setFieldValue } = useFormik({
  //   initialValues: options,
  //   allowReinitialize: true,
  //   onSubmit: (values, { setSubmitting }) => {
  //     return new Promise(async (resolve, reject) => {
  //       try {
  //         const result = await _put("/api/admin/config", values);
  //         if (result) {
  //           toast({ description: "La configuration a été mise à jour." });
  //         }
  //         await getOptions();
  //       } catch (e) {
  //         console.error(e);
  //         toast({
  //           description: "Une erreur est survenue lors de la mise à jour de la configuration.",
  //           status: "error",
  //         });
  //       }

  //       setSubmitting(false);
  //       resolve("onSubmitHandler complete");
  //     });
  //   },
  // });

  const createUser = useCallback(
    async (user, resetForm) => {
      try {
        const result = await _post("/api/admin/users", user);
        if (result.user) {
          toast({ description: "L'utilisateur a été créé." });
          setUsers([...users, result.user]);
          resetForm();
        }
      } catch (e) {
        console.error(e);
        toast({
          description: "Une erreur est survenue lors de la création de l'utilisateur.",
          status: "error",
        });
      }
    },
    [toast, users]
  );

  const updateUser = useCallback(
    async ({ _id, ...user }) => {
      try {
        const result = await _put("/api/admin/users/" + _id, user);
        if (result.user) {
          toast({ description: "L'utilisateur a été mis à jour." });

          setUsers([...users.map((u) => (u._id === _id ? result.user : u))]);
        }
      } catch (e) {
        console.error(e);
        toast({
          description: "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
          status: "error",
        });
      }
    },
    [toast, users]
  );

  const deleteUser = useCallback(
    async (user) => {
      try {
        const result = await _delete("/api/admin/users/" + user._id);

        if (result) {
          setUsers(users.filter((u) => u._id !== user._id));

          toast({ description: "L'utilisateur a été supprimé." });
        }
      } catch (e) {
        console.error(e);
        toast({
          description: "Une erreur est survenue lors de la suppression de l'utilisateur.",
          status: "error",
        });
      }
    },
    [toast, users]
  );

  if (!isAdmin(auth)) {
    return (
      <>
        <Breadcrumb items={[{ label: "Gestion des utilisateurs", url: "/admin/users" }]} />
        <Page title="Accès refusé">Vous n'avez pas les droits suffisants pour accéder à cette page.</Page>
      </>
    );
  }

  if (!academies?.length) {
    return;
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Gestion des utilisateurs", url: "/admin/users" }]} />

      <Page title={"Gestion des utilisateurs"}>
        <Box my={12}>
          <Heading as="h3" size="md" mb={4}>
            Créer un utilisateur :
          </Heading>

          <Box my={6}>
            <Formik
              initialValues={{
                type: null,
                username: "",
                email: "",
                academies: null,
              }}
              enableReinitialize
              onSubmit={createUser}
            >
              {({ values, setFieldValue, resetForm, onSubmit }) => (
                <Box flexDirection="row">
                  {/* <pre>{JSON.stringify(values, null, 2)} </pre> */}

                  <Flex>
                    <Field name="type">
                      {({ field, meta, value }) => (
                        <FormControl p={4} isRequired isInvalid={meta.error && meta.touched}>
                          <FormLabel>Type</FormLabel>
                          {value}
                          <Select
                            {...field}
                            placeholder="Veuillez sélectionner le type d'utilisateur"
                            value={typeOptions.filter((option) => values.type === option.value)}
                            onChange={(option) => setFieldValue("type", option.value)}
                            options={typeOptions}
                          />
                        </FormControl>
                      )}
                    </Field>

                    <Field name="username">
                      {({ field, meta }) => (
                        <FormControl p={4} isRequired isInvalid={meta.error && meta.touched}>
                          <FormLabel>Nom d'utilisateur</FormLabel>
                          <Input {...field} autoComplete="off" placeholder="Veuillez saisir le nom d'utilisateur" />
                        </FormControl>
                      )}
                    </Field>
                  </Flex>

                  <Field name="email">
                    {({ field, meta }) => (
                      <FormControl p={4} isRequired isInvalid={meta.error && meta.touched}>
                        <FormLabel>Email</FormLabel>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="off"
                          placeholder="Veuillez saisir l'adresse courriel de l'utilisateur"
                        />
                      </FormControl>
                    )}
                  </Field>

                  {values.type === USER_TYPE.ACADEMIE && (
                    <Field name="academies">
                      {({ field, meta }) => (
                        <FormControl p={4} mb={16} isRequired isInvalid={meta.error && meta.touched}>
                          <FormLabel>Académies</FormLabel>
                          <Select
                            {...field}
                            selectedOptionStyle="check"
                            variant="outline"
                            value={academiesOptions.filter((option) => values.academies?.includes(option.value))}
                            onChange={(options) =>
                              setFieldValue(
                                "academies",
                                options.map((option) => option.value)
                              )
                            }
                            isMulti
                            placeholder="Veuillez sélectionner les académies auxquelles cet utilisateur a accès"
                            options={academiesOptions}
                          />
                        </FormControl>
                      )}
                    </Field>
                  )}

                  <Flex justifyContent={"right"}>
                    <Button m={4} type="submit" onClick={resetForm}>
                      Annuler
                    </Button>
                    <Button m={4} type="submit" colorScheme="green" onClick={() => createUser(values, resetForm)}>
                      Ajouter un utilisateur
                    </Button>
                  </Flex>
                </Box>
              )}
            </Formik>
          </Box>
        </Box>

        <Divider my={12} />

        <Box my={12}>
          <Heading as="h3" size="md" mb={4}>
            Liste des utilisateurs :
          </Heading>

          <Flex p={4} gap={4} flexDirection={{ base: "column", md: "row" }}>
            <Box w="30%">
              <FormControl p={4}>
                <FormLabel>Rechercher par type</FormLabel>
                <Select
                  value={typeOptions.filter((option) => searchType === option.value)}
                  onChange={(value) => setSearchType(value?.value)}
                  isClearable
                  placeholder="Sélectionnez un type d'utilisateur"
                  options={typeOptions}
                />
              </FormControl>
              {searchType === USER_TYPE.ACADEMIE && (
                <FormControl p={4}>
                  <FormLabel>Rechercher par académie</FormLabel>
                  <Select
                    value={academiesOptions.filter((option) => searchAcademie === option.value)}
                    onChange={(value) => setSearchAcademie(value?.value)}
                    isClearable
                    placeholder="Sélectionnez une académie"
                    options={academiesOptions}
                  />
                </FormControl>
              )}
            </Box>

            <FormControl p={4} w="70%">
              <FormLabel>Rechercher par nom d'utilisateur ou adresse courriel</FormLabel>
              <Input
                placeholder="Renseignez un nom d'utilisateur ou une adresse courriel"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>
          </Flex>

          <Box my={8}>
            <Accordion allowToggle mt={8} m={0}>
              {users.map((user) => (
                <AccordionItem
                  m={0}
                  overflow="visible !important"
                  id={user._id}
                  key={user._id}
                  hidden={
                    (searchTerm &&
                      searchTerm !== "" &&
                      !user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (searchType && searchType !== "" && user.type !== searchType) ||
                    (searchType &&
                      searchType === USER_TYPE.ACADEMIE &&
                      searchAcademie &&
                      searchAcademie !== "" &&
                      !user.academies?.map((a) => a.code)?.includes(searchAcademie))
                  }
                >
                  {({ isExpanded }) => (
                    <>
                      <Heading size="sm">
                        <AccordionButton>
                          <Badge colorScheme={user.type === USER_TYPE.ADMIN ? "red" : "blue"} mx={2} p={1}>
                            {user.type}
                          </Badge>

                          <Badge mx={2} p={1} colorScheme={user.statut === USER_STATUS.ACTIVE ? "green" : "orange"}>
                            {user.statut}
                          </Badge>

                          <Text as="span" mx={6}>
                            <Text as="b">{user.username}</Text> - {user.email}
                          </Text>
                          {user.type === USER_TYPE.ACADEMIE &&
                            user.academies?.map((academie) => (
                              <Badge key={academie.code} mx={2} p={1}>
                                {academie.nom}
                              </Badge>
                            ))}
                        </AccordionButton>
                      </Heading>

                      <AccordionPanel>
                        {isExpanded && (
                          <Box my={6}>
                            <Formik
                              initialValues={{
                                _id: user._id,
                                type: user.type,
                                username: user.username,
                                email: user.email,
                                academies: user.academies?.map((a) => a.code) ?? [],
                              }}
                              enableReinitialize
                              onSubmit={updateUser}
                            >
                              {({ values, setFieldValue, resetForm }) => (
                                <Box flexDirection="row">
                                  {/* <pre>{JSON.stringify(values, null, 2)} </pre> */}
                                  <Field name="_id">
                                    {({ field, meta, value }) => <Input {...field} type="hidden" />}
                                  </Field>

                                  <Flex>
                                    <Field name="type">
                                      {({ field, meta, value }) => (
                                        <FormControl p={4} isRequired isInvalid={meta.error && meta.touched}>
                                          <FormLabel>Type</FormLabel>
                                          {value}
                                          <Select
                                            {...field}
                                            value={typeOptions.filter((option) => values.type === option.value)}
                                            onChange={(option) => setFieldValue("type", option.value)}
                                            options={typeOptions}
                                          />
                                        </FormControl>
                                      )}
                                    </Field>

                                    <Field name="username">
                                      {({ field, meta }) => (
                                        <FormControl p={4} isRequired isInvalid={meta.error && meta.touched}>
                                          <FormLabel>Nom d'utilisateur</FormLabel>
                                          <Input
                                            {...field}
                                            autoComplete="off"
                                            placeholder="Veuillez saisir le nom d'utilisateur"
                                          />
                                        </FormControl>
                                      )}
                                    </Field>
                                  </Flex>

                                  <Field name="email">
                                    {({ field, meta }) => (
                                      <FormControl p={4} isRequired isInvalid={meta.error && meta.touched}>
                                        <FormLabel>Email</FormLabel>
                                        <Input
                                          {...field}
                                          type="email"
                                          autoComplete="off"
                                          placeholder="Veuillez saisir l'adresse courriel de l'utilisateur"
                                        />
                                      </FormControl>
                                    )}
                                  </Field>

                                  {values.type === USER_TYPE.ACADEMIE && (
                                    <Field name="academies">
                                      {({ field, meta }) => (
                                        <FormControl p={4} mb={16} isRequired isInvalid={meta.error && meta.touched}>
                                          <FormLabel>Académies</FormLabel>
                                          <Select
                                            {...field}
                                            selectedOptionStyle="check"
                                            variant="outline"
                                            value={academiesOptions.filter((option) =>
                                              values.academies.includes(option.value)
                                            )}
                                            onChange={(options) =>
                                              setFieldValue(
                                                "academies",
                                                options.map((option) => option.value)
                                              )
                                            }
                                            isMulti
                                            placeholder="Veuillez sélectionner les académies auxquelles cet utilisateur a accès"
                                            options={academiesOptions}
                                          />
                                        </FormControl>
                                      )}
                                    </Field>
                                  )}

                                  <Flex justifyContent={"space-between"}>
                                    <Box>
                                      <Button m={4} colorScheme="red" onClick={() => deleteUser(user)}>
                                        Supprimer l'utilisateur
                                      </Button>
                                    </Box>
                                    <Box>
                                      <Button m={4} onClick={resetForm}>
                                        Annuler
                                      </Button>
                                      <Button
                                        m={4}
                                        colorScheme="green"
                                        type="submit"
                                        onClick={() => updateUser(values)}
                                      >
                                        Sauvegarder les modifications
                                      </Button>
                                    </Box>
                                  </Flex>
                                </Box>
                              )}
                            </Formik>
                          </Box>
                        )}
                      </AccordionPanel>
                    </>
                  )}
                </AccordionItem>
              ))}
            </Accordion>

            {users.filter(
              (user) =>
                !(
                  (searchTerm &&
                    searchTerm !== "" &&
                    !user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (searchType && searchType !== "" && user.type !== searchType) ||
                  (searchType &&
                    searchType === USER_TYPE.ACADEMIE &&
                    searchAcademie &&
                    searchAcademie !== "" &&
                    !user.academies?.map((a) => a.code)?.includes(searchAcademie))
                )
            ).length === 0 && <Text>Aucun utilisateur correspondant</Text>}
          </Box>
        </Box>
      </Page>
    </>
  );
};
