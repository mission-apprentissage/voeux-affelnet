import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";
import queryString from "query-string";

export const useDownloadVoeux = () => {
  return useCallback(async ({ gestionnaire, formateur }) => {
    const filename = `${gestionnaire.siret}-${formateur.uai}.csv`;

    const content = await fetch(`/api/admin/gestionnaires/${gestionnaire.siret}/formateurs/${formateur.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};

export const useDownloadStatut = () => {
  return useCallback(async (query) => {
    const filename = `export.csv`;

    const content = await fetch(`/api/admin/users/export.csv?${queryString.stringify(query)}`, {
      method: "GET",
      headers: getHeaders(),
      // body: JSON.stringify(query),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};
