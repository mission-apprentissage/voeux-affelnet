import { Box, Text, Heading, Button, useDisclosure, Table, Thead, Tr, Th, Tbody, Td, Alert } from "@chakra-ui/react";

import { Page } from "../../common/components/layout/Page";

import { Breadcrumb } from "../../common/components/Breadcrumb";
import { EtablisssementRaisonSociale } from "../../common/components/etablissement/fields/EtablissementLibelle";
import { RelationStatut } from "../../common/components/delegue/fields/RelationStatut";
import { HistoryBlock } from "../../common/components/history/HistoryBlock";
import { useDownloadVoeux } from "../../common/hooks/delegueHooks";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { DownloadVoeuxModal } from "../../common/components/delegue/modals/DownloadVoeuxModal";
import { DownloadIcon } from "@chakra-ui/icons";

export const Delegue = ({ delegue, callback }) => {
  const downloadVoeux = useDownloadVoeux({ callback });
  const [searchParams] = useSearchParams();

  const siret_responsable = searchParams.get("siret_responsable");
  const siret_formateur = searchParams.get("siret_formateur");

  const {
    onOpen: onOpenDownloadVoeuxModal,
    isOpen: isOpenDownloadVoeuxModal,
    onClose: onCloseDownloadVoeuxModal,
  } = useDisclosure();

  useEffect(() => {
    if (siret_responsable && siret_formateur) {
      onOpenDownloadVoeuxModal();
    }
  }, [onOpenDownloadVoeuxModal, siret_responsable, siret_formateur]);

  if (!delegue) {
    return;
  }

  const title = (
    <>Accès aux listes de candidats ayant exprimé des vœux sur le service en ligne "Choisir son orientation"</>
  );
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
            <Box key={siret} my={12}>
              <Alert status="info" display={"block"}>
                <Text>
                  Organisme responsable : <EtablisssementRaisonSociale etablissement={responsable} />
                </Text>

                <Text mt={2}>
                  Adresse : {responsable?.adresse} - SIRET : {responsable?.siret ?? "Inconnu"} - UAI :{" "}
                  {responsable?.uai ?? "Inconnu"}
                </Text>
                <Text mt={2}>
                  Contact au sein de l'organisme responsable : <Text as="b">{responsable?.email ?? "Inconnu"}</Text>
                </Text>
              </Alert>
              <Box mt={8}>
                <Box>
                  <Table>
                    <Thead>
                      <Tr borderBottom="2px solid" borderColor="gray.200">
                        <Th> Organismes formateurs associés</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {relations.map((relation, index) => (
                        <Tr key={relation?.formateur?.siret} borderBottom="2px solid" borderColor="gray.200">
                          <Td py={8}>
                            {/* <RelationFormateur relation={relation} callback={reload} /> */}
                            <Box>
                              <Heading as="h4" size="md">
                                <EtablisssementRaisonSociale etablissement={relation.formateur} />
                              </Heading>
                              <Text mt={4}>
                                Adresse : {relation.formateur?.adresse} - SIRET :{" "}
                                {relation.formateur?.siret ?? "Inconnu"} - UAI : {relation.formateur?.uai ?? "Inconnu"}
                              </Text>

                              <Text mt={8}>
                                {/* Statut de diffusion des listes : */}
                                <RelationStatut relation={relation} />
                              </Text>

                              {!!relation?.nombre_voeux && (
                                <Button
                                  mt={4}
                                  variant="primary"
                                  onClick={async () =>
                                    await downloadVoeux({
                                      responsable: relation.responsable,
                                      formateur: relation.formateur,
                                    })
                                  }
                                >
                                  <DownloadIcon mr={2} />
                                  Télécharger la liste
                                </Button>
                              )}

                              <Box mt={8}>
                                <HistoryBlock relation={relation} delegue={delegue} />
                              </Box>
                            </Box>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Page>
    </>
  );
};
