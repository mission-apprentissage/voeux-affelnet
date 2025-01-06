import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";
import queryString from "query-string";

export const useDownloadVoeux = () => {
  return useCallback(async ({ responsable, formateur }) => {
    const filename = `${responsable?.uai}-${formateur?.uai}.csv`;

    const content = await fetch(`/api/admin/responsables/${responsable?.uai}/formateurs/${formateur?.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};

export const useDownloadStatut = () => {
  return useCallback(async (query) => {
    const filename = `export.csv`;

    const content = await fetch(`/api/admin/etablissements/export.csv?${queryString.stringify(query)}`, {
      method: "GET",
      headers: getHeaders(),
      // body: JSON.stringify(query),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};
