import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";

export const useDownloadVoeux = ({ responsable: initialResponsable, formateur: initialFormateur, callback }) => {
  return useCallback(
    async ({ responsable, formateur } = { responsable: initialResponsable, formateur: initialFormateur }) => {
      const filename = `${responsable?.siret}-${formateur?.siret}.csv`;

      const content = await fetch(`/api/responsable/formateurs/${formateur?.siret}/voeux`, {
        method: "GET",
        headers: getHeaders(),
      });

      downloadCSV(filename, await content.blob());

      await callback?.();
    },
    [initialResponsable, initialFormateur, callback]
  );
};
