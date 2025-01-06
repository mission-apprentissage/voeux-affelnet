import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = () => {
  return useCallback(async ({ responsable, formateur }) => {
    const filename = `${responsable?.uai}-${formateur?.uai}.csv`;

    const content = await fetch(`/api/delegue/${responsable?.uai}/${formateur?.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};
