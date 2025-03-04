import {
  Box,
  Button,
  Heading,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";

import { History } from "../../../../pages/responsable/History";

export const ResponsableHistoryModal = ({ responsable, callback, isOpen, onClose }) => {
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
          <History responsable={responsable} />
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
