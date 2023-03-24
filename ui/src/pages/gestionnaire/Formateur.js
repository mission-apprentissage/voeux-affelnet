import { useParams } from "react-router-dom";
import { FormateurLibelle } from "../../common/components/fields/formateur/Libelle";
import { Page } from "../../common/components/layout/Page";
import {
  Box,
  Text,
  Link,
  Button,
  Heading,
  List,
  ListItem,
  Accordion,
  AccordionItem,
  AccordionIcon,
  AccordionButton,
  AccordionPanel,
} from "@chakra-ui/react";

export const Formateur = ({ gestionnaire, formateurs }) => {
  const { uai } = useParams();
  const formateur = formateurs?.find((formateur) => formateur.uai === uai);

  console.log(formateur);

  if (!formateur) {
    return;
  }

  const etablissement = gestionnaire.etablissements?.find((etablissement) => etablissement.uai === formateur.uai);

  const isDiffusionAutorisee = etablissement?.diffusionAutorisee;

  return (
    <>
      <Page title={"Accès aux listes de vœux exprimés sur le service en ligne Affelnet"}>
        <Box mb={8}>
          <Heading as="h3" size="md" display="flex" mb={4}>
            Organisme formateur :&nbsp;
            <FormateurLibelle formateur={formateur} />
          </Heading>
          <Text mb={4}>
            Adresse : {formateur.adresse} {formateur.cp} {formateur.commune} – Siret : {formateur.siret ?? "Inconnu"} –
            UAI : {formateur.uai ?? "Inconnu"}
          </Text>
          <Box style={{ borderLeft: "4px solid black", paddingLeft: "16px" }} my={6}>
            <Text mb={4}>Organisme responsable : {gestionnaire.raison_sociale}</Text>
            <Text mb={4}>
              38 AVENUE CHARLES DE GAULLE, 71400 Autun – Siret : {gestionnaire.siret ?? "Inconnu"} – UAI :{" "}
              {gestionnaire.uai ?? "Inconnu"}
            </Text>
            <Text mb={4}>
              Personne habilitée à réceptionner les listes de vœux au sein de l'organisme responsable :{" "}
              {gestionnaire.email}
            </Text>
            <Text mb={4}>
              <Link variant="action" href="/gestionnaire">
                Accéder à la page de l'organisme responsable
              </Link>
            </Text>
          </Box>

          {isDiffusionAutorisee ? (
            <>
              La délégation des droits de réception des listes de vœux a été activée pour cet organisme formateur.
              Personne habilitée à réceptionner les listes de vœux au sein de l'organisme formateur :{" "}
              {etablissement?.email} <Link variant="action">(modifier)</Link>
            </>
          ) : (
            <>
              <Text mb={4}>
                La délégation des droits de réception des listes de vœux n'a pas été activée pour cet organisme
                formateur. Seul le responsable peut les réceptionner.
              </Text>
              <Button variant="primary" mb={4}>
                Activer la délégation de droits
              </Button>
            </>
          )}
        </Box>

        <Box mb={8}>
          <Heading as="h3" size="md" mb={4}>
            Statut
          </Heading>

          <Heading as="h4" size="sm" mb={4}>
            Nombre de vœux disponibles : 12
          </Heading>

          <Text mb={4}>Date de mise à disposition : 12/06/2023</Text>

          {isDiffusionAutorisee ? (
            <></>
          ) : (
            <>
              <Button variant="primary" mb={4}>
                Télécharger la liste
              </Button>
            </>
          )}
        </Box>

        {isDiffusionAutorisee && (
          <Box mb={8}>
            <Heading as="h3" size="md" mb={4}>
              Que souhaitez-vous faire ?
            </Heading>

            <Accordion defaultIndex={[]} allowToggle>
              <AccordionItem mb={0}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Je souhaite que l'organisme formateur télécharge la liste
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    Prenez contact avec la personne destinataire pour l'inviter à télécharger la liste. Si la personne
                    n'a pas reçu d'email de notification invitez-la à consulter ses spam, en lui communiquant la date à
                    laquelle la dernière notification lui a été envoyée (JJ/MM/AAAA, hh:mm) et l'expéditeur des
                    notifications ({process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}).
                  </Text>
                  <Text mb={4}>
                    Si malgré tout la personne ne retrouve pas la notification, vous pouvez essayer de{" "}
                    <Link variant="action">générer un nouvel envoi de notification courriel</Link>.
                  </Text>
                  <Text mb={4}>
                    Vous pouvez également <Link variant="action">modifier l'email de la personne habilitée</Link>.
                  </Text>
                  <Text mb={4}>
                    En cas de problème,{" "}
                    <Link variant="action">vous pouvez signaler une anomalie à l'équipe technique</Link>.
                  </Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem mb={0}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Je télécharge la liste et je la transférerai par mes propres moyens à l'organisme responsable
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    En procédant à ce téléchargement, vous annulez la délégation de droits précédemment accordée à
                    {etablissement.email}. Vous devrez vous assurer par vos propres moyens que les jeunes ayant exprimé
                    leurs vœux fassent l'objet d'une réponse rapide.
                  </Text>

                  <Button variant="primary" mb={4}>
                    Télécharger la liste
                  </Button>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem mb={0}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Je télécharge la liste mais je souhaite que {etablissement.email} la télécharge également
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text mb={4}>
                    En procédant à ce téléchargement, la délégation accordée à {etablissement.email} reste en vigueur.
                  </Text>
                  <Text mb={4}>
                    La liste restera considérée comme non téléchargée jusqu'à ce que {etablissement.email} procède au
                    téléchargement : prenez contact avec la personne destinataire pour l'inviter à télécharger la liste.
                    Si la personne n'a pas reçu d'email de notification invitez-la à consulter ses spam, en lui
                    communiquant la date à laquelle la dernière notification lui a été envoyée (JJ/MM/AAAA, hh:mm) et
                    l'expéditeur des notifications ({process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}).
                  </Text>
                  <Text mb={4}>
                    Si malgré tout la personne ne retrouve pas la notification, vous pouvez essayer de{" "}
                    <Link variant="action">générer un nouvel envoi de notification courriel</Link>.
                  </Text>
                  <Text mb={4}>
                    Vous pouvez également <Link variant="action">modifier l'email de la personne habilitée</Link>.
                  </Text>
                  <Button variant="primary" mb={4}>
                    Télécharger la liste
                  </Button>
                  <Text mb={4}>
                    En cas de problème,{" "}
                    <Link variant="action">vous pouvez signaler une anomalie à l'équipe technique</Link>.
                  </Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        )}

        <Box mb={8}>
          <Link variant="action">Utilisateur Ymag ou IGesti ?</Link>
        </Box>

        <Box mb={8}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>
          <List>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
            <ListItem>-</ListItem>
          </List>
        </Box>

        <Box mb={8}>
          <Link variant="action">Signaler une anomalie</Link>
        </Box>
      </Page>
    </>
  );
};
