import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Stack,
  Heading,
} from "@chakra-ui/react";
import { useDownloadVoeux } from "../../../hooks/delegueHooks";
import { EtablissementLibelle } from "../../etablissement/fields/EtablissementLibelle";
import { useSearchParams } from "react-router-dom";

export const DownloadVoeuxModal = ({ relation, callback, isOpen, onClose }) => {
  const responsable = relation?.responsable ?? relation?.etablissements_responsable;
  const formateur = relation?.formateur ?? relation?.etablissements_formateur;
  const [searchParams, setSearchParams] = useSearchParams();

  const downloadVoeux = useDownloadVoeux({
    responsable,
    formateur,
  });

  const download = useCallback(async () => {
    await downloadVoeux();
    await callback?.();

    if (searchParams.has("siret_responsable") && searchParams.has("siret_formateur")) {
      searchParams.delete("siret_responsable");
      searchParams.delete("siret_formateur");
      setSearchParams(searchParams);
    }

    await onClose();
  }, [downloadVoeux, callback, onClose, searchParams, setSearchParams]);

  if (!responsable || !formateur) {
    return;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Téléchargement de la liste de candidats pour l'établissement{" "}
            <EtablissementLibelle etablissement={formateur} />
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <Text fontSize="lg" mb={6}>
            Vous vous apprêtez à télécharger la liste de candidats pour l'établissement{" "}
            <EtablissementLibelle etablissement={formateur} />.
          </Text>
          {/*
          <Text mb={4}>
            Après validation de cette délégation, le destinataire sera automatiquement informé par courriel, et devra
            procéder à la création de son mot de passe pour accéder à son espace de téléchargement. Si la personne ne
            reçoit pas le courriel de notification, invitez-la à vérifier dans ses spam.
          </Text> */}

          <Stack>
            <Button variant="primary" onClick={download}>
              Télécharger
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
