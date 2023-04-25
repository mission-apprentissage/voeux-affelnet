import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useCallback } from "react";

export const ValidationModal = ({ isOpen, onClose, callback, title, children }) => {
  const accept = useCallback(
    async (event) => {
      await callback();
      onClose(event);
    },
    [callback, onClose]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalCloseButton />
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          {callback ? (
            <>
              <Button variant="primary" mr={3} onClick={accept}>
                Oui
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Non
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onClose}>
              Fermé
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
