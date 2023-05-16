import React, { useCallback } from "react";
import { Box, Text, Heading, Link, Alert, Button } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../common/hooks/formateurHooks";
import { SuccessLine } from "../../theme/components/icons";
import { Page } from "../../common/components/layout/Page";
import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { GestionnaireLibelle } from "../../common/components/gestionnaire/fields/GestionnaireLibelle";
import { GestionnaireEmail } from "../../common/components/formateur/fields/GestionnaireEmail";
import { FormateurEmail } from "../../common/components/formateur/fields/FormateurEmail";
import { History } from "../gestionnaire/History";

export const Formateur = ({ formateur, gestionnaires, callback }) => {
  const downloadVoeux = useDownloadVoeux({ formateur });

  const downloadVoeuxAndReload = useCallback(
    async ({ gestionnaire }) => {
      await downloadVoeux({ gestionnaire });
      await callback();
    },
    [downloadVoeux, callback]
  );

  if (!formateur) {
    return;
  }

  return (
    <>
      <Page title={"Accès aux listes de candidats ayant exprimé des vœux sur le service en ligne affectation"}>
        <Box mb={4}>
          <Heading as="h3" size="md" display="flex" mb={4}>
            Organisme formateur :&nbsp;
            <FormateurLibelle formateur={formateur} />
          </Heading>

          <Text mb={4}>
            Adresse : {formateur.adresse} - Siret : {formateur.siret ?? "Inconnu"} - UAI : {formateur.uai ?? "Inconnu"}
          </Text>
        </Box>

        {formateur.etablissements.map((etablissement, index) => {
          const gestionnaire = gestionnaires?.find((gestionnaire) => gestionnaire.siret === etablissement.siret);

          if (!gestionnaire) {
            return <React.Fragment key={index}></React.Fragment>;
          }

          const hasVoeux = etablissement.nombre_voeux > 0;

          const isDiffusionAutorisee = etablissement?.diffusionAutorisee;

          const voeuxTelechargementsFormateur = formateur.voeux_telechargements.filter(
            (telechargement) => telechargement.siret === gestionnaire.siret
          );

          const voeuxTelechargementsGestionnaire = gestionnaire.voeux_telechargements.filter(
            (telechargement) => telechargement.uai === formateur.uai
          );

          const voeuxTelechargesAtLeastOnce = !isDiffusionAutorisee
            ? !!voeuxTelechargementsGestionnaire.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.first_date_voeux).getTime()
              )
            : !!voeuxTelechargementsFormateur?.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.first_date_voeux).getTime()
              );

          const voeuxTelecharges = !isDiffusionAutorisee
            ? !!voeuxTelechargementsGestionnaire.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
              )
            : !!voeuxTelechargementsFormateur.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
              );
          const hasUpdatedVoeux = voeuxTelechargesAtLeastOnce && !voeuxTelecharges;

          return (
            <React.Fragment key={index}>
              <Alert status="info" variant="left-accent" my={6}>
                <Box>
                  <Text mb={2}>
                    <Text as="b" style={{ textDecoration: "underline" }}>
                      Organisme responsable
                    </Text>{" "}
                    : <GestionnaireLibelle gestionnaire={gestionnaire} />
                  </Text>
                  <Text mb={2}>
                    Adresse : {gestionnaire.adresse ?? "Inconnue"} – Siret : {gestionnaire.siret ?? "Inconnu"} – UAI :{" "}
                    {gestionnaire.uai ?? "Inconnu"}
                  </Text>
                  <Text mb={2}>
                    Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
                    <GestionnaireEmail gestionnaire={gestionnaire} />
                  </Text>
                </Box>
              </Alert>

              <Box mb={12}>
                <Text mb={4}>
                  {isDiffusionAutorisee ? (
                    <>
                      La délégation des droits de réception des listes a été activée pour votre organisme à l'adresse :{" "}
                      <FormateurEmail formateur={formateur} gestionnaire={gestionnaire} />.
                    </>
                  ) : (
                    <>La délégation des droits de réception n'est pas activée pour votre organisme.</>
                  )}
                </Text>
              </Box>

              <Box mb={12} id="statut">
                <Heading as="h3" size="md" mb={4}>
                  Statut
                </Heading>

                <Heading as="h4" size="sm" mb={4}>
                  {hasUpdatedVoeux ? (
                    <>
                      Une liste mise à jour de {etablissement.nombre_voeux} candidats est disponible pour cet
                      établissement.
                    </>
                  ) : (
                    <>Nombre de candidats: {etablissement.nombre_voeux}</>
                  )}
                </Heading>

                {hasVoeux ? (
                  <>
                    <Text mb={4}>
                      Date de mise à disposition : {new Date(etablissement.first_date_voeux).toLocaleDateString()}{" "}
                      {etablissement.last_date_voeux !== etablissement.first_date_voeux && (
                        <>| Dernière mise à jour : {new Date(etablissement.last_date_voeux).toLocaleDateString()}</>
                      )}
                    </Text>
                    {hasUpdatedVoeux && (
                      <Text mb={4}>
                        Cette mise à jour peut comporter de nouveaux candidats, des suppressions, ou des mises à jour.
                      </Text>
                    )}

                    {isDiffusionAutorisee ? (
                      <>
                        {voeuxTelecharges ? (
                          <>
                            <Text mb={4}>
                              <SuccessLine verticalAlign="text-bottom" height="20px" width="20px" mr={2} /> Vous (
                              {formateur.email}) avez téléchargé la liste.{" "}
                              <Link variant="action" onClick={() => downloadVoeuxAndReload({ gestionnaire })}>
                                Télécharger à nouveau
                              </Link>
                            </Text>
                            <Text mb={4}>
                              Si une mise à jour de cette liste est disponible, vous en serez notifié par courriel.
                            </Text>
                          </>
                        ) : (
                          <>
                            <Button variant="primary" mb={4} onClick={() => downloadVoeuxAndReload({ gestionnaire })}>
                              Télécharger la liste
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {voeuxTelecharges ? (
                          <>
                            <Text mb={4}>
                              La liste des candidats a été téléchargée par votre organisme responsable. Vous pouvez le
                              contacter ({gestionnaire.email}) pour la récupérer.
                            </Text>
                            <Text mb={4}>
                              Si une mise à jour de cette liste est disponible, l'utilisateur en sera notifié par
                              courriel.
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text mb={4}>
                              La liste des candidats n'a pas été téléchargée par votre organisme responsable (
                              {gestionnaire.email}). Vous pouvez le contacter pour l'inviter à la télécharger et vous la
                              transmettre.
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Text mb={4}>
                      La liste des vœux exprimés sera rendue disponible entre le vendredi 2 juin et le lundi 5 juin. Un
                      courriel de notification vous sera envoyé pour vous notifier de cette mise à disposition
                      (expéditeur du courriel :{" "}
                      <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                        {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                      </Link>
                      ). Si après le 5 juin vous n’avez reçu aucun courriel, veuillez vérifier vos spam, ou transmettez
                      un signalement.
                    </Text>
                    <Text mb={4}>
                      Cette première liste pourra être mise à jour la semaine du 3 juillet, pour prendre en compte les
                      modifications de vœux, les suppressions et les ajouts. Une notification courriel sera également
                      envoyée lors de cette mise à jour.
                    </Text>
                  </>
                )}
              </Box>
            </React.Fragment>
          );
        })}

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>
          <History /*gestionnaire={gestionnaire}*/ formateur={formateur} />
        </Box>

        <Box mb={12}>
          <Link href="/support" variant="action">
            Signaler une anomalie
          </Link>
        </Box>
      </Page>
    </>
  );
};
