import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ formateur }) => {
  return useCallback(async () => {
    const filename = `${formateur.uai}.csv`;

    const content = await fetch(`/api/gestionnaire/formateurs/${formateur.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, [formateur]);
};
