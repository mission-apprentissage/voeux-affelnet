import React from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  Box,
  Button,
  Heading,
  Link,
  Text,
  useDisclosure,
  UnorderedList,
  ListItem,
  OrderedList,
} from "@chakra-ui/react";

import { setTitle } from "../common/utils/pageUtils";
import { Page } from "../common/components/layout/Page";

export const AnomaliePage = () => {
  const title = "Besoin d'aide ? ";
  setTitle(title);

  return (
    <Page title={title}>
      <Heading as="h3" size="md" mb={4}>
        Veuillez préciser votre besoin
      </Heading>

      <Accordion defaultIndex={[]} allowToggle>
        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>Le site m’indique m’avoir envoyé un courriel de notification mais je ne l’ai pas reçu.</strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>Veuillez vérifier dans votre boîte Spam.</Text>
            <Text mb={4}>
              Si le message n’est pas dans vos Spam, et si possible, demandez à votre service informatique si le mail
              est bloqué au niveau du serveur de messagerie, en précisant :
              <UnorderedList>
                <ListItem>l’heure à laquelle le message aurait dû être reçu,</ListItem>
                <ListItem>
                  l’expéditeur du message :{" "}
                  <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                    {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                  </Link>
                </ListItem>
              </UnorderedList>
            </Text>
            <Text mb={4}>
              Si le message reste introuvable, veuillez{" "}
              <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                faire un signalement à l’équipe de diffusion
              </Link>
              , en indiquant votre numéro Siret et UAI, et l’adresse courriel sur laquelle vous auriez dû recevoir la
              notification.
            </Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>
                  Je n'ai pas accès aux listes de tous les organismes formateurs dont je suis responsable. Ou à
                  l’inverse, j’ai accès à des organismes pour lesquels je ne devrais pas être identifié comme
                  responsable.
                </strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>
              Les relations entre les organismes responsables des offres de formation et les organismes formateurs sont
              basées sur les enregistrements effectués auprès des Carif-Oref.
            </Text>
            <Text mb={4}>
              Ces offres et les relations responsables-formateurs correspondantes sont visibles sur le catalogue
              national des offres de formation en apprentissage :{" "}
              <Link variant="action" href="https://catalogue-apprentissage.intercariforef.org/recherche/formations">
                https://catalogue-apprentissage.intercariforef.org/recherche/formations
              </Link>
            </Text>
            <Text mb={4}>
              Si des relations sont manquantes :
              <UnorderedList>
                <ListItem>
                  Faites un signalement à l’équipe en charge de la diffusion des listes de candidats , en indiquant :
                  <UnorderedList>
                    <ListItem>
                      Le numéro Siret figurant dans nos correspondances (numéro Siret qui vous sert d’identifiant de
                      connexion au service),
                    </ListItem>
                    <ListItem>
                      Le ou les code(s) UAI des organismes formateurs manquants ou auxquels vous ne devriez pas être
                      associé en tant qu’organisme responsable.
                    </ListItem>
                  </UnorderedList>
                </ListItem>

                <ListItem>
                  <Link variant="action" href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                    Rapprochez-vous de votre Carif-Oref
                  </Link>{" "}
                  pour faire corriger les relations responsables-formateurs incorrectes au niveau des enregistrements
                  Carif-Oref, afin d’anticiper la diffusion des listes de candidats en 2024.
                </ListItem>
              </UnorderedList>
            </Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>Mon code UAI et/ou mon numéro de Siret est incorrect.</strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>
              Les codes UAI des organismes formateurs sont issus du référentiel Siret-UAI (
              <Link variant="action" href="https://referentiel.apprentissage.onisep.fr/organismes/">
                https://referentiel.apprentissage.onisep.fr/organismes/
              </Link>
              ) à partir du numéro de Siret enregistré par le Carif-Oref. Les couples Siret-UAI sont fiabilisés par les
              services statistiques des académies.{" "}
            </Text>
            <Text mb={4}>
              Si votre numéro de Siret est correct, mais que votre code UAI est incorrect, vous pouvez en faire le
              signalement à l'équipe du référentiel Siret-UAI
            </Text>
            <Text mb={4}>
              Si votre numéro de Siret est incorrect,{" "}
              <Link variant="action" href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                rapprochez-vous de votre Carif-Oref
              </Link>{" "}
              pour faire corriger les enregistrements des offres de formation, afin d’anticiper la diffusion des listes
              de candidats en 2024.
            </Text>
            <Text mb={4}>
              Si vous pensez que les erreurs de Siret ou d'UAI impactent la diffusion des listes de candidats, veuillez
              en{" "}
              <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                faire le signalement à l'équipe en charge de la diffusion des listes
              </Link>
              , en précisant toutes les informations utiles (Siret et UAI actuellement enregistrés, corrections
              attendues).
            </Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>
                  D'autres informations (adresse de lieu de formation, raison sociale de l'organisme formateur et/ou
                  responsable, …) sont erronées.
                </strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>
              Les informations descriptives des offres et des organismes sont issues des enregistrements d'offres
              effectués auprès du Carif-Oref, complétés d'informations descriptives issues de divers référentiels (en
              particulier la{" "}
              <Link variant="action" href="https://www.sirene.fr/sirene/public/recherche">
                base Sirene de l'Insee
              </Link>
              , en ce qui concerne les raisons sociales).
            </Text>
            <Text mb={4}>
              La provenance des informations est indiquée sur le{" "}
              <Link variant="action" href="https://catalogue-apprentissage.intercariforef.org/recherche/formations">
                catalogue national des formations en apprentissage
              </Link>{" "}
              : en face de chaque donnée, survoler le picto "i" pour obtenir l'information.
            </Text>
            <Text mb={4}>
              En fonction de la provenance des informations, vous pourrez vous rapprocher soit de l'Insee, soit de votre{" "}
              <Link variant="action" href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                Carif-Oref
              </Link>
              .
            </Text>
            <Text mb={4}>
              Si vous n'identifiez pas l'origine de l'anomalie, rapprochez-vous de votre{" "}
              <Link variant="action" href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                Carif-Oref
              </Link>
              .
            </Text>
            <Text mb={4}>
              Si vous ne trouvez pas vos formations sur le{" "}
              <Link variant="action" href="https://catalogue-apprentissage.intercariforef.org/recherche/formations">
                catalogue national des formations en apprentissage
              </Link>
              , il est possible que votre offre ait été créée directement dans Affelnet par le SAIO dont vous dépendez.
              Rapprochez-vous dans ce cas de votre SAIO.
            </Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>J'ai un problème d'affichage ou de fonctionnement qui m'empêche d'utiliser le service.</strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>Dans certains cas, le fait de répéter l'action peut suffire à résoudre votre problème.</Text>
            <Text mb={4}>
              Si le problème se reproduit, essayez si possible de vous connecter à partir d'un autre navigateur internet
              (Firefox, Chrome, Safari, Edge, …).
            </Text>
            <Text mb={4}>
              Si le problème persiste, veuillez{" "}
              <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                envoyer un message à l'équipe en charge de la diffusion des listes de candidats
              </Link>{" "}
              en indiquant :
              <UnorderedList>
                <ListItem>
                  Le numéro Siret et/ou code UAI figurant dans nos correspondances (code qui vous sert d’identifiant de
                  connexion au service),
                </ListItem>
                <ListItem>La navigateur internet que vous utilisez et son numéro de version</ListItem>
                <ListItem>
                  L'URL de la page sur laquelle vous avez rencontré le problème, et si possible l'URL de la page
                  précédente.
                </ListItem>
                <ListItem>Un descriptif détaillé de l'action que vous avez souhaité effectuer</ListItem>
                <ListItem>Si c'est pertinent, veuillez également joindre des captures d'écran.</ListItem>
              </UnorderedList>
            </Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>
                  J'ai besoin d'informations générales sur le planning et les modalités de diffusion des listes de
                  candidats.
                </strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>Le planning de diffusion des listes de candidats est le suivant : </Text>

            <UnorderedList>
              <ListItem>
                <Text mb={4}>
                  Phase 1 : une première campagne courriel est diffusée en première quinzaine de mai, afin d'identifier
                  les directeurs d’organismes responsables, confirmer leur adresse email, et leur permettre de créer
                  leur mot de passe de connexion au service.
                </Text>
                <Box mb={4}>
                  <Text as="i">
                    L' arrêté du 17 juillet 2017 , au 7e alinéa de l’article 4, précise que seuls les directeurs des
                    organismes responsables des offres de formation sont habilités à recevoir les données transmises
                    mentionnées à l’article 3 de ce même arrêté. En 2023, un arrêté (à paraître) permet aux directeurs
                    d'organismes responsables de déléguer les droits de réception directe des listes de candidats à
                    d'autres personnes.
                  </Text>
                </Box>
              </ListItem>
              <ListItem>
                <Text mb={4}>
                  Phase 1bis (optionnelle) : les directeurs d'organismes responsables activent, s’ils le souhaitent, des
                  délégations de droits permettant à d'autres personnes d'accéder au service de téléchargement des
                  listes pour les organismes formateurs. Chaque organisme formateur peut faire l'objet d'une délégation
                  de droits distincte.
                </Text>
              </ListItem>

              <ListItem>
                <Text mb={4}>
                  Phase 2 : dans la semaine du 5 juin, diffusion par courriel des notifications de mise à disposition
                  des listes de candidats. Cette diffusion est effectuée auprès des personnes habilitées (qui auront
                  préalablement créé leur compte pour l’accès au service).
                </Text>
              </ListItem>

              <ListItem>
                <Text mb={4}>
                  Phase 3 : dans la semaine du 19 juin, diffusion par courriel des notifications de mise à jour des
                  listes de candidats (le cas échéant). Une seule mise à jour sera diffusée en 2023, contre deux en
                  2022. Les mises à jour peuvent correspondre à des suppressions, ajouts ou modifications de
                  candidatures.
                </Text>
              </ListItem>

              <ListItem>
                <Text mb={4}>
                  Pour toute autre question relative au planning et aux modalités de diffusion des listes de candidats,
                  vous pouvez{" "}
                  <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                    adresser un courriel à l'équipe de diffusion
                  </Link>
                  , en indiquant vos numéros Siret et UAI.
                </Text>
              </ListItem>
            </UnorderedList>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem mb={0}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                <strong>Autres</strong>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={4}>
              Pour les questions relatives à la diffusion des listes de candidats, contactez{" "}
              <Link variant="action" href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                l'équipe de diffusion
              </Link>{" "}
              (Direction du numérique pour l'éducation).
            </Text>
            <Text mb={4}>
              Pour les questions relatives à la description de vos offres de formation (informations erronées, offres
              manquantes, …), contactez votre{" "}
              <Link variant="action" href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                Carif-Oref
              </Link>
              .
            </Text>
            <Text mb={4}>Pour toute autre question, veuillez contacter votre SAIO.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Page>
  );
};

export default AnomaliePage;
