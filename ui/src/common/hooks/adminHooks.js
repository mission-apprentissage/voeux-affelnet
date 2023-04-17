import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = () => {
  return useCallback(async ({ gestionnaire, formateur }) => {
    const filename = `${gestionnaire.siret}-${formateur.uai}.csv`;

    const content = await fetch(`/api/admin/gestionnaires/${gestionnaire.siret}/formateurs/${formateur}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};
