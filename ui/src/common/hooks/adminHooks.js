import { useCallback, useState } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";
import queryString from "query-string";
import { useToast } from "@chakra-ui/react";

export const useDownloadVoeux = ({ responsable: initialResponsable, formateur: initialFormateur, callback }) => {
  const toast = useToast();
  const [isDownloadingVoeux, setIsDownloadingVoeux] = useState(false);

  const downloadVoeux = useCallback(
    async ({ responsable, formateur } = { responsable: initialResponsable, formateur: initialFormateur }) => {
      try {
        setIsDownloadingVoeux(true);

        const filename = `${responsable?.siret}-${formateur?.siret}.csv`;

        const content = await fetch(
          `/api/admin/responsables/${responsable?.siret}/formateurs/${formateur?.siret}/voeux`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

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

export const useDownloadStatut = () => {
  const [isDownloadingStatut, setIsDownloadingStatut] = useState(false);

  const downloadStatut = useCallback(async (query) => {
    setIsDownloadingStatut(true);
    const filename = `export.csv`;

    try {
      const content = await fetch(`/api/admin/etablissements/export.csv?${queryString.stringify(query)}`, {
        method: "GET",
        headers: getHeaders(),
        // body: JSON.stringify(query),
      });

      downloadCSV(filename, await content.blob());
      setIsDownloadingStatut(false);
    } catch (error) {
      setIsDownloadingStatut(false);
      console.error("Error downloading statut:", error);
      throw error;
    }
  }, []);

  return {
    isDownloadingStatut,
    // setIsDownloadingStatut,
    downloadStatut,
  };
};
