import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ gestionnaire, formateur }) => {
  return useCallback(async () => {
    const filename = `${gestionnaire.siret}-${formateur.uai}.csv`;

    const content = await fetch(`/api/gestionnaire/formateurs/${formateur.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, [gestionnaire, formateur]);
};
