import { useCallback, useState } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";
import queryString from "query-string";
import { useToast } from "@chakra-ui/react";

export const useDownloadVoeux = ({ responsable: initialResponsable, formateur: initialFormateur, callback }) => {
  const toast = useToast();
  const [isDownloadingVoeux, setIsDownloadingVoeux] = useState(false);

  const downloadVoeux = useCallback(
    async (
      { responsable, formateur, mark_as_downloaded, comment } = {
        responsable: initialResponsable,
        formateur: initialFormateur,
        mark_as_downloaded: false,
        comment: null,
      }
    ) => {
      try {
        setIsDownloadingVoeux(true);

        const filename = `${responsable?.siret}-${formateur?.siret}.csv`;

        const content = await fetch(
          `/api/admin/responsables/${responsable?.siret}/formateurs/${formateur?.siret}/voeux`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ mark_as_downloaded, comment }),
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

export const useDownloadByFormationStatut = () => {
  const [isDownloadingStatut, setIsDownloadingStatut] = useState(false);

  const downloadStatut = useCallback(async (query) => {
    setIsDownloadingStatut(true);
    const filename = `export-formations.csv`;

    try {
      const content = await fetch(`/api/admin/etablissements/export-formations.csv?${queryString.stringify(query)}`, {
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

export const useDownloadByRelationStatut = () => {
  const [isDownloadingStatut, setIsDownloadingStatut] = useState(false);

  const downloadStatut = useCallback(async (query) => {
    setIsDownloadingStatut(true);
    const filename = `export-relations.csv`;

    try {
      const content = await fetch(`/api/admin/etablissements/export-relations.csv?${queryString.stringify(query)}`, {
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
