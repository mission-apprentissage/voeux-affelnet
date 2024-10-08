import { useCallback, Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text, Heading, Link, Alert, Button, Tr, Td, Tbody, Th, Thead, Table } from "@chakra-ui/react";

import { useDownloadVoeux } from "../../common/hooks/delegueHooks";
import { Page } from "../../common/components/layout/Page";
import { FormateurLibelle } from "../../common/components/formateur/fields/FormateurLibelle";
import { ResponsableLibelle } from "../../common/components/responsable/fields/ResponsableLibelle";
import { FormateurStatut } from "../../common/components/delegue/fields/FormateurStatut";
import { Breadcrumb } from "../../common/components/Breadcrumb";

export const Relations = ({ delegue, callback }) => {
  const navigate = useNavigate();

  const downloadVoeux = useDownloadVoeux();

  const downloadVoeuxAndReload = useCallback(
    async ({ responsable, formateur }) => {
      await downloadVoeux({ responsable, formateur });
      await callback();
    },
    [downloadVoeux, callback]
  );

  const relations = delegue?.relations?.filter((relation) => relation.active) ?? [];

  useEffect(() => {
    if (relations.length === 1) {
      const relation = relations[0];
      const responsable =
        relation.responsable ?? relation.etablissements_responsable ?? relation.etablissement_responsable;
      const formateur = relation.formateur ?? relation.etablissements_formateur ?? relation.etablissement_formateur;
      navigate(`/delegue/relations/${responsable?.siret}/${formateur?.uai}`, { replace: true });
    }
  }, [relations, navigate]);

  if (!delegue) {
    return;
  }

  const title =
    "Accès aux listes de candidats ayant exprimé des vœux sur le service en ligne affectation / Liste des délégations de droits accordées";

  return (
    <>
      <Breadcrumb
        items={[
          {
            label: title,
            url: "/delegue/relations",
          },
        ]}
      />

      <Page title={title}>
        <Box mb={12}>
          <Text mb={4}>
            <strong>
              Voici les délégations de droit au téléchargement des listes de candidats qui vous ont été accordées.
            </strong>
          </Text>
        </Box>

        <Box mb={12}>
          {!!relations.length ? (
            <Table mt={12}>
              <Thead>
                <Tr>
                  <Th width="80px"></Th>

                  <Th width="400px">Responsable (délégation accordée par)</Th>
                  <Th width="400px">Formateur (délégation accordée pour)</Th>

                  <Th width={"70px"}>Candidats</Th>
                  <Th width={"70px"}>Restant à télécharger</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {relations.map((relation, index) => {
                  const responsable = relation?.responsable;
                  const formateur = relation?.formateur;

                  if (!relation || !responsable || !formateur) {
                    return <Fragment key={index}></Fragment>;
                  }

                  const hasVoeux = relation.nombre_voeux > 0;

                  const isDiffusionAutorisee = relation?.active;

                  const voeuxTelechargementsFormateur =
                    formateur?.voeux_telechargements_responsable?.filter(
                      (telechargement) => telechargement.siret === responsable?.siret
                    ) ?? [];

                  const voeuxTelechargementsResponsable =
                    responsable?.voeux_telechargements_formateur?.filter(
                      (telechargement) => telechargement.uai === formateur?.uai
                    ) ?? [];

                  const voeuxTelechargesAtLeastOnce = !isDiffusionAutorisee
                    ? !!voeuxTelechargementsResponsable.find(
                        (telechargement) =>
                          new Date(telechargement.date).getTime() >= new Date(relation.first_date_voeux).getTime()
                      )
                    : !!voeuxTelechargementsFormateur?.find(
                        (telechargement) =>
                          new Date(telechargement.date).getTime() >= new Date(relation.first_date_voeux).getTime()
                      );

                  const voeuxTelecharges = !isDiffusionAutorisee
                    ? !!voeuxTelechargementsResponsable.find(
                        (telechargement) =>
                          new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
                      )
                    : !!voeuxTelechargementsFormateur.find(
                        (telechargement) =>
                          new Date(telechargement.date).getTime() >= new Date(relation.last_date_voeux).getTime()
                      );
                  const hasUpdatedVoeux = voeuxTelechargesAtLeastOnce && !voeuxTelecharges;

                  return (
                    <Tr key={index}>
                      <Td>
                        <Link variant="primary" href={`/delegue/relations/${responsable?.siret}/${formateur?.uai}`}>
                          Détail
                        </Link>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <ResponsableLibelle responsable={responsable} />
                        </Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>
                          <FormateurLibelle formateur={formateur} />
                        </Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>{relation.nombre_voeux.toLocaleString()}</Text>
                      </Td>
                      <Td>
                        <Text lineHeight={6}>{relation.nombre_voeux_restant.toLocaleString()}</Text>
                      </Td>

                      <Td>
                        <Text lineHeight={6}>
                          <FormateurStatut relation={relation} callback={callback} showDownloadButton />
                        </Text>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <>Aucune délégation de droit ne vous est accordée.</>
          )}
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
