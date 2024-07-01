import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ responsable, formateur }) => {
  return useCallback(async () => {
    const filename = `${responsable.siret}-${formateur?.uai}.csv`;

    const content = await fetch(`/api/responsable/formateurs/${formateur?.uai}/voeux`, {
      method: "GET",
      headers: getHeaders(),
    });

    downloadCSV(filename, await content.blob());
  }, [responsable, formateur]);
};
