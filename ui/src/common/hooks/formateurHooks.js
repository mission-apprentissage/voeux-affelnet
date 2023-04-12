import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ formateur }) => {
  return useCallback(
    async ({ gestionnaire }) => {
      const filename = `${formateur.uai}.csv`;

      const content = await fetch(`/api/formateur/gestionnaire/${gestionnaire.siret}/voeux`, {
        method: "GET",
        headers: getHeaders(),
      });

      downloadCSV(filename, await content.blob());
    },
    [formateur]
  );
};
