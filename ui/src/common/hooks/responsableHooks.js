import { useCallback, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ responsable: initialResponsable, formateur: initialFormateur, callback }) => {
  const toast = useToast();
  const [isDownloadingVoeux, setIsDownloadingVoeux] = useState(false);

  const downloadVoeux = useCallback(
    async ({ responsable, formateur } = { responsable: initialResponsable, formateur: initialFormateur }) => {
      try {
        setIsDownloadingVoeux(true);

        const filename = `${responsable?.siret}-${formateur?.siret}.csv`;

        const content = await fetch(`/api/responsable/formateurs/${formateur?.siret}/voeux`, {
          method: "GET",
          headers: getHeaders(),
        });

        downloadCSV(filename, await content.blob());

        setIsDownloadingVoeux(false);

        await callback?.();
      } catch (error) {
        setIsDownloadingVoeux(false);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du téléchargement du fichier.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    },
    [initialResponsable, initialFormateur, callback, toast]
  );

  return {
    isDownloadingVoeux,
    // setIsDownloadingVoeux,
    downloadVoeux,
  };
};
