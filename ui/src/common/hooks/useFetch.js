import { useState, useEffect, useRef } from "react";
import { _get } from "../httpClient";

export const useFetch = (url, initialState = null) => {
  const [response, setResponse] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(true);

  useEffect(() => {
    const abortController = new AbortController();

    const _fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await _get(url, { signal: abortController.signal });
        setResponse(response);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    if (ref.current) {
      _fetch();
    }

    return () => {
      ref.current = false;
      // abortController.abort();
    };
  }, [url]);

  return [response, loading, error, setResponse];
};
