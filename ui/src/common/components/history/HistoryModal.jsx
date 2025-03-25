import {
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";

import { HistoryList } from "./HistoryList";

export const HistoryModal = ({ relation, responsable, delegue, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading as="h2" size="lg">
            Historique des actions
          </Heading>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <HistoryList relation={relation} responsable={responsable} delegue={delegue} />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
