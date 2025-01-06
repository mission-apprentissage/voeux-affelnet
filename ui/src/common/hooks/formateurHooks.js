import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ formateur }) => {
  return useCallback(
    async ({ responsable }) => {
      const filename = `${responsable?.uai}-${formateur?.uai}.csv`;

      const content = await fetch(`/api/formateur/responsables/${responsable?.uai}/voeux`, {
        method: "GET",
        headers: getHeaders(),
      });

      downloadCSV(filename, await content.blob());
    },
    [formateur]
  );
};
