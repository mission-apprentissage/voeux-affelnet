import { useCallback, Fragment } from "react";
import { Box, Text, Heading, Link, Alert, Button } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../common/hooks/formateurHooks";
import { SuccessLine } from "../../theme/components/icons";
import { Page } from "../../common/components/layout/Page";
import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../../common/components/responsable/fields/ResponsableLibelle";
import { ResponsableEmail } from "../../common/components/formateur/fields/ResponsableEmail";
import { FormateurEmail } from "../../common/components/formateur/fields/FormateurEmail";
import { History } from "../responsable/History";

export const Formateur = ({ formateur, responsables, callback }) => {
  const downloadVoeux = useDownloadVoeux({ formateur });

  const downloadVoeuxAndReload = useCallback(
    async ({ responsable }) => {
      await downloadVoeux({ responsable });
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
          <Heading as="h3" size="md" mb={4}>
            Organisme formateur :&nbsp;
            <FormateurLibelle formateur={formateur} />
          </Heading>

          <Text mb={4}>
            Adresse : {formateur?.adresse} - Siret : {formateur?.siret ?? "Inconnu"} - UAI :{" "}
            {formateur?.uai ?? "Inconnu"}
          </Text>
        </Box>

        {formateur?.etablissements_responsable.map((etablissement, index) => {
          const responsable = responsables?.find((responsable) => responsable.siret === etablissement.siret);

          if (!responsable) {
            return <Fragment key={index}></Fragment>;
          }

          const hasVoeux = etablissement.nombre_voeux > 0;

          const isDiffusionAutorisee = etablissement?.diffusion_autorisee;

          const voeuxTelechargementsFormateur = formateur?.voeux_telechargements_responsable.filter(
            (telechargement) => telechargement.siret === responsable.siret
          );

          const voeuxTelechargementsResponsable = responsable.voeux_telechargements_formateur.filter(
            (telechargement) => telechargement.uai === formateur?.uai
          );

          const voeuxTelechargesAtLeastOnce = !isDiffusionAutorisee
            ? !!voeuxTelechargementsResponsable.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.first_date_voeux).getTime()
              )
            : !!voeuxTelechargementsFormateur?.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.first_date_voeux).getTime()
              );

          const voeuxTelecharges = !isDiffusionAutorisee
            ? !!voeuxTelechargementsResponsable.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
              )
            : !!voeuxTelechargementsFormateur.find(
                (telechargement) =>
                  new Date(telechargement.date).getTime() >= new Date(etablissement.last_date_voeux).getTime()
              );
          const hasUpdatedVoeux = voeuxTelechargesAtLeastOnce && !voeuxTelecharges;

          return (
            <Box
              key={index}
              my={formateur?.etablissements_responsable.length > 1 ? 18 : 12}
              borderLeft={formateur?.etablissements_responsable.length > 1 ? "2px solid" : "none"}
              paddingLeft={formateur?.etablissements_responsable.length > 1 ? 4 : 0}
            >
              <Alert status="info" variant="left-accent" my={6}>
                <Box>
                  <Text mb={2}>
                    <Text as="b" style={{ textDecoration: "underline" }}>
                      Organisme responsable
                    </Text>{" "}
                    : <ResponsableLibelle responsable={responsable} />
                  </Text>
                  <Text mb={2}>
                    Adresse : {responsable.adresse ?? "Inconnue"} – Siret : {responsable.siret ?? "Inconnu"} – UAI :{" "}
                    {responsable.uai ?? "Inconnu"}
                  </Text>
                  <Text mb={2}>
                    Personne habilitée à réceptionner les listes de candidats au sein de l'organisme responsable :{" "}
                    <ResponsableEmail responsable={responsable} />
                  </Text>
                </Box>
              </Alert>

              <Box mb={12}>
                <Text mb={4}>
                  {isDiffusionAutorisee ? (
                    <>
                      La délégation des droits de réception des listes a été activée pour votre organisme à l'adresse :{" "}
                      <FormateurEmail formateur={formateur} responsable={responsable} />.
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
                      Une liste mise à jour de {etablissement.nombre_voeux.toLocaleString()} candidat
                      {etablissement.nombre_voeux > 1 ? "s" : ""} est disponible pour cet établissement.
                    </>
                  ) : (
                    <>Nombre de candidats: {etablissement.nombre_voeux.toLocaleString()}</>
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
                              {formateur?.email}) avez téléchargé la liste.{" "}
                              <Link variant="action" onClick={() => downloadVoeuxAndReload({ responsable })}>
                                Télécharger à nouveau
                              </Link>
                            </Text>
                            <Text mb={4}>
                              Si une mise à jour de cette liste est disponible, vous en serez notifié par courriel.
                            </Text>
                          </>
                        ) : (
                          <>
                            <Button variant="primary" mb={4} onClick={() => downloadVoeuxAndReload({ responsable })}>
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
                              contacter ({responsable.email}) pour la récupérer.
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
                              {responsable.email}). Vous pouvez le contacter pour l'inviter à la télécharger et vous la
                              transmettre.
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : new Date().getTime() <= new Date("2024/06/05").getTime() ? (
                  <>
                    <Text mb={4}>
                      La liste des vœux exprimés sera rendue disponible dans la semaine du 5 juin. Un courriel de
                      notification{" "}
                      {isDiffusionAutorisee ? (
                        <>vous sera envoyé pour vous </>
                      ) : (
                        <>sera envoyé à votre responsable pour le </>
                      )}{" "}
                      notifier de cette mise à disposition (expéditeur du courriel :{" "}
                      <Link href={`mailto:${process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}`}>
                        {process.env.REACT_APP_VOEUX_AFFELNET_EMAIL}
                      </Link>
                      ).{" "}
                      {isDiffusionAutorisee && (
                        <>
                          Vérifiez vos spam si besoin, ou{" "}
                          <Link href="/support" variant="action">
                            transmettez un signalement
                          </Link>
                          .
                        </>
                      )}
                    </Text>
                    <Text mb={4}>
                      Cette première liste pourra être mise à jour la semaine du 19 juin, pour prendre en compte les
                      modifications de vœux, les suppressions et les ajouts. Une notification courriel sera également
                      envoyée lors de cette mise à jour.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text mb={4}>
                      Aucun vœu n’a été exprimé pour cet organisme sur la période de formulation des demandes (du 9 au
                      30 mai).
                    </Text>
                    <Text mb={4}>
                      Si vous pensez qu’il s’agit d’une anomalie, vous pouvez{" "}
                      <Link href="/support" variant="action">
                        transmettre un signalement
                      </Link>
                      .
                    </Text>
                  </>
                )}
              </Box>
            </Box>
          );
        })}

        <Box mb={12}>
          <Link variant="action" href="/ymag-ou-igesti">
            Utilisateur Ymag ou IGesti ?
          </Link>
        </Box>

        <Box mb={12}>
          <Heading as="h3" size="md" mb={4}>
            Historique des actions
          </Heading>
          <History /*responsable={responsable}*/ formateur={formateur} />
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
