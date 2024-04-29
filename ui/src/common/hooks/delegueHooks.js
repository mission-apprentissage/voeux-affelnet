import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = () => {
  return useCallback(async ({ responsable, formateur }) => {
    const filename = `${responsable?.siret}-${formateur?.uai}.csv`;

    const content = await fetch(`/api/delegue/${responsable?.siret}/${formateur?.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, []);
};
