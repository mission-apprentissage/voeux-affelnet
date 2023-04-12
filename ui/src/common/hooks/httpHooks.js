import { useState, useCallback, useEffect, useRef } from "react";
import { _get, _put } from "../httpClient";

export function useGet(url, initalState = {}) {
  const [response, setResponse] = useState(initalState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const sendRequest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await _get(url);
      setResponse(response);
      setLoading(false);
    } catch (error) {
      setError(error.json);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    async function run() {
      if (!mountedRef.current) {
        mountedRef.current = true;
        return sendRequest();
      }
    }
    run();
  }, [sendRequest]);

  return [response, loading, error];
}

export function usePut(url, body) {
  const [response, setResponse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const sendRequest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await _put(url, body || {});
      setResponse(response);
      setLoading(false);
    } catch (error) {
      setError(error.json);
      setLoading(false);
    }
  }, [body, url]);

  useEffect(() => {
    async function run() {
      if (!mountedRef.current) {
        mountedRef.current = true;
        return sendRequest();
      }
    }
    run();
  }, [sendRequest]);

  return [response, loading, error];
}
