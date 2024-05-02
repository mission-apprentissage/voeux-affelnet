import { useCallback, Fragment, useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Text, Heading, Link, Alert, Button, useToast, Spinner } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../common/hooks/delegueHooks";
import { SuccessLine } from "../../theme/components/icons";
import { Page } from "../../common/components/layout/Page";
import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../../common/components/responsable/fields/ResponsableLibelle";
import { ResponsableEmail } from "../../common/components/formateur/fields/ResponsableEmail";
import { FormateurEmail } from "../../common/components/formateur/fields/FormateurEmail";
import { _get } from "../../common/httpClient";
import { UserType } from "../../common/constants/UserType";
import { History } from "../responsable/History";

export const Relation = ({ delegue, callback }) => {
  const { siret, uai } = useParams();

  const downloadVoeux = useDownloadVoeux();

  const downloadVoeuxAndReload = useCallback(
    async ({ responsable, formateur }) => {
      await downloadVoeux({ responsable, formateur });
      await callback();
    },
    [downloadVoeux, callback]
  );
  const mounted = useRef(false);
  const toast = useToast();

  const relation = delegue?.relations?.find(
    (relation) =>
      relation.etablissement_responsable.siret === siret &&
      relation.etablissement_formateur.uai === uai &&
      relation.active
  );

  if (!delegue) {
    return;
  }

  if (!relation) {
    return <>L'accès à cette ressource n'est pas possible.</>;
  }

  const responsable = relation.responsable ?? relation.etablissements_responsable;
  const formateur = relation.formateur ?? relation.etablissements_formateur;

  const hasVoeux = relation.nombre_voeux > 0;

  const isDiffusionAutorisee = relation?.active;

  // const voeuxTelechargementsResponsable = responsable?.voeux_telechargements_formateur.filter(
  //   (telechargement) => telechargement.uai === formateur?.uai
  // );

  const voeuxTelechargementsResponsable = relation.voeux_telechargements.filter(
    (telechargement) => telechargement.userType === UserType.RESPONSABLE
  );

  const voeuxTelechargementsDelegue = relation.voeux_telechargements.filter(
    (telechargement) => telechargement.userType === UserType.DELEGUE
  );

  const voeuxTelechargesAtLeastOnce = !isDiffusionAutorisee
    ? !!voeuxTelechargementsResponsable.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.first_date_voeux).getTime()
      )
    : !!voeuxTelechargementsDelegue?.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.first_date_voeux).getTime()
      );

  const voeuxTelechargesDate = !isDiffusionAutorisee
    ? voeuxTelechargementsResponsable.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
      )
    : voeuxTelechargementsDelegue.find(
        (telechargement) => new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
      );

  const voeuxTelecharges = !!voeuxTelechargesDate;

  const hasUpdatedVoeux = voeuxTelechargesAtLeastOnce && !voeuxTelecharges;

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

        <Box>
          <Alert status="info" variant="left-accent" my={6}>
            <Box>
              <Text mb={2}>
                <Text as="b" style={{ textDecoration: "underline" }}>
                  Organisme responsable
                </Text>{" "}
                : <ResponsableLibelle responsable={responsable} />
              </Text>
              <Text mb={2}>
                Adresse : {responsable?.adresse ?? "Inconnue"} – Siret : {responsable?.siret ?? "Inconnu"} – UAI :{" "}
                {responsable?.uai ?? "Inconnu"}
              </Text>
              <Text mb={2}>
                Contact au sein de l’organisme responsable : <ResponsableEmail responsable={responsable} />
              </Text>

              {isDiffusionAutorisee ? (
                <Text mb={2}>
                  Cette personne vous a accordé une délégation au droit de téléchargement des listes de candidats pour
                  cet organisme formateur.
                </Text>
              ) : (
                <></>
              )}
            </Box>
          </Alert>

          <Box mb={12}>
            <Text mb={4}>
              {isDiffusionAutorisee ? (
                <>
                  La délégation des droits de réception des listes a été activée pour cet organisme à l'adresse :{" "}
                  <FormateurEmail formateur={formateur} responsable={responsable} delegue={delegue} />.
                </>
              ) : (
                <>La délégation des droits de réception n'est pas activée pour cet organisme.</>
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
                  Une liste mise à jour de {relation.nombre_voeux.toLocaleString()} candidat
                  {relation.nombre_voeux > 1 ? "s" : ""} est disponible pour cet établissement.
                </>
              ) : (
                <>Nombre de candidats: {relation.nombre_voeux.toLocaleString()}</>
              )}
            </Heading>

            {hasVoeux ? (
              <>
                <Text mb={4}>
                  Date de mise à disposition : {new Date(relation.first_date_voeux).toLocaleDateString()}{" "}
                  {relation.last_date_voeux !== relation.first_date_voeux && (
                    <>| Dernière mise à jour : {new Date(relation.last_date_voeux).toLocaleDateString()}</>
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
                          {delegue.email}) avez téléchargé la liste le{" "}
                          {new Date(voeuxTelechargesDate?.date)?.toLocaleDateString()}.{" "}
                          <Link variant="action" onClick={() => downloadVoeuxAndReload({ responsable, formateur })}>
                            Télécharger à nouveau
                          </Link>
                        </Text>
                        <Text mb={4}>
                          Si une mise à jour de cette liste est disponible, vous en serez notifié par courriel.
                        </Text>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          mb={4}
                          onClick={() => downloadVoeuxAndReload({ responsable, formateur })}
                        >
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
                          contacter ({responsable?.email}) pour la récupérer.
                        </Text>
                        <Text mb={4}>
                          Si une mise à jour de cette liste est disponible, l'utilisateur en sera notifié par courriel.
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text mb={4}>
                          La liste des candidats n'a pas été téléchargée par votre organisme responsable (
                          {responsable?.email}). Vous pouvez le contacter pour l'inviter à la télécharger et vous la
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
                  Aucun vœu n’a été exprimé pour cet organisme sur la période de formulation des demandes (du 9 au 30
                  mai).
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

          <Box mb={12}>
            <Heading as="h3" size="md" mb={4}>
              Historique des actions
            </Heading>

            <History relation={relation} />
          </Box>

          <Box mb={12}>
            <Link variant="action" href="/ymag-ou-igesti">
              Utilisateur Ymag ou IGesti ?
            </Link>
          </Box>

          <Box mb={12}>
            <Link href="/support" variant="action">
              Signaler une anomalie
            </Link>
          </Box>
        </Box>
      </Page>
    </>
  );
};
