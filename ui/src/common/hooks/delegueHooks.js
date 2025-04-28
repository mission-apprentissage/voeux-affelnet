import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ responsable: initialResponsable, formateur: initialFormateur, callback }) => {
  const toast = useToast();

  return useCallback(
    async ({ responsable, formateur } = { responsable: initialResponsable, formateur: initialFormateur }) => {
      const filename = `${responsable?.siret}-${formateur?.siret}.csv`;

      let content;

      try {
        content = await fetch(`/api/delegue/${responsable?.siret}/${formateur?.siret}/voeux`, {
          method: "GET",
          headers: getHeaders(),
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du téléchargement du fichier.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      downloadCSV(filename, await content.blob());

      await callback?.();
    },
    [initialResponsable, initialFormateur, callback, toast]
  );
};
