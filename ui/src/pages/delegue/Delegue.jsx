import { Box, Text, Heading, Button, useDisclosure } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";

import { Breadcrumb } from "../../common/components/Breadcrumb";
import { EtablissementLibelle } from "../../common/components/etablissement/fields/EtablissementLibelle";
import { RelationStatut } from "../../common/components/delegue/fields/RelationStatut";
import { HistoryBlock } from "../../common/components/history/HistoryBlock";
import { useDownloadVoeux } from "../../common/hooks/delegueHooks";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { DownloadVoeuxModal } from "../../common/components/delegue/modals/DownloadVoeuxModal";

export const Delegue = ({ delegue, callback }) => {
  const downloadVoeux = useDownloadVoeux({ callback });
  const [searchParams] = useSearchParams();

  const siret_responsable = searchParams.get("siret_responsable");
  const siret_formateur = searchParams.get("siret_formateur");

  const {
    onOpen: onOpenUDownloadVoeuxModal,
    isOpen: isOpenDownloadVoeuxModal,
    onClose: onCloseDownloadVoeuxModal,
  } = useDisclosure();

  useEffect(() => {
    if (siret_responsable && siret_formateur) {
      onOpenUDownloadVoeuxModal();
    }
  }, [onOpenUDownloadVoeuxModal, siret_responsable, siret_formateur]);

  if (!delegue) {
    return;
  }

  const title = <>Accès aux listes de candidats ayant exprimé des vœux sur le service en ligne affectation</>;
  const activeRelations = delegue?.relations?.filter((relation) => relation.active) ?? [];

  const responsables = [...new Set(activeRelations?.map((relation) => relation.responsable?.siret))];

  // console.log(responsables);

  const downloadRelation = activeRelations.find(
    (relation) => relation.formateur?.siret === siret_formateur && relation.responsable?.siret === siret_responsable
  );

  return (
    <>
      <DownloadVoeuxModal
        relation={downloadRelation}
        callback={callback}
        isOpen={isOpenDownloadVoeuxModal}
        onClose={onCloseDownloadVoeuxModal}
      />

      <Breadcrumb
        items={[
          {
            label: title,
            url: "/delegue",
          },
        ]}
      />

      <Page title={title}>
        <Heading as="h4" size="sm" mb={4}>
          Liste des organismes pour lesquels le responsable vous a délégué le droit exclusif d'accès aux listes de
          candidats aux offres de formation en apprentissage, ayant exprimé des vœux sur le service en ligne
          affectation.
        </Heading>

        {responsables?.map((siret) => {
          const relations = activeRelations?.filter((relation) => relation.responsable?.siret === siret);
          const responsable = relations?.find((relation) => relation.responsable?.siret === siret)?.responsable;

          return (
            <Box key={siret} mt={12}>
              <Heading as="h4" size="md" style={{ textDecoration: "underline" }}>
                Organisme responsable : <EtablissementLibelle etablissement={responsable} />
              </Heading>

              <Text mt={4}>
                Adresse : {responsable?.adresse} - SIRET : {responsable?.siret ?? "Inconnu"} - UAI :{" "}
                {responsable?.uai ?? "Inconnu"}
              </Text>
              <Text mt={4}>
                Contact au sein de l'organisme responsable : <Text as="b">{responsable?.email ?? "Inconnu"}</Text>
              </Text>

              <Box mt={12}>
                <Box>
                  <Heading as="h3" size="md" mb={8} style={{ textDecoration: "underline" }}>
                    Organismes formateurs associés
                  </Heading>

                  {relations.map((relation) => (
                    <Box mt={12} key={relation?.formateur?.siret}>
                      <Box mt={8} key={relation.etablissement_formateur.siret}>
                        <Heading as="h4" size="md">
                          <EtablissementLibelle etablissement={relation.formateur} />
                        </Heading>
                        <Text mt={4}>
                          Adresse : {relation.formateur?.adresse} - SIRET : {relation.formateur?.siret ?? "Inconnu"} -
                          UAI : {relation.formateur?.uai ?? "Inconnu"}
                        </Text>
                        <Text mt={6}>
                          {/* Statut de diffusion des listes : */}
                          <RelationStatut relation={relation} />
                        </Text>

                        {!!relation?.nombre_voeux && (
                          <Button
                            mt={6}
                            variant="primary"
                            onClick={async () =>
                              await downloadVoeux({
                                responsable: relation.responsable,
                                formateur: relation.formateur,
                              })
                            }
                          >
                            Télécharger la liste
                          </Button>
                        )}

                        <Box mt={6}>
                          <HistoryBlock relation={relation} />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Page>
    </>
  );
};
