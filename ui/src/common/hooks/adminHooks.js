import { useCallback } from "react";
import { getHeaders } from "../httpClient";
import { downloadCSV } from "../utils/downloadUtils";
import queryString from "query-string";

export const useDownloadVoeux = ({ responsable: initialResponsable, formateur: initialFormateur, callback }) => {
  return useCallback(
    async ({ responsable, formateur } = { responsable: initialResponsable, formateur: initialFormateur }) => {
      const filename = `${responsable?.siret}-${formateur?.siret}.csv`;

      const content = await fetch(
        `/api/admin/responsables/${responsable?.siret}/formateurs/${formateur?.siret}/voeux`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      downloadCSV(filename, await content.blob());

      await callback?.();
    },
    [initialFormateur, initialResponsable, callback]
  );
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
