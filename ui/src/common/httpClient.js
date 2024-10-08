import { getAuth } from "./auth";
import { emitter } from "./emitter";

class AuthError extends Error {
  constructor(json, statusCode) {
    super(`Request rejected with status code ${statusCode}`);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Identifiant ou mot de passe invalide";
  }
}

class HTTPError extends Error {
  constructor(message, json, statusCode) {
    super(message);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Une erreur technique est survenue";
  }
}

const handleResponse = async (path, response) => {
  const statusCode = response.status;
  const json = await response.json();

  if (statusCode >= 400 && statusCode < 600) {
    emitter.emit("http:error", response);

    if (statusCode === 401 || statusCode === 403) {
      throw new AuthError(json, statusCode);
    } else {
      throw new HTTPError(`Server returned ${statusCode} when requesting resource ${path}`, json, statusCode);
    }
  }
  return json;
};

export const getHeaders = () => {
  const auth = getAuth();

  return {
    Accept: "application/json",
    ...(auth.sub !== "anonymous" ? { Authorization: `Bearer ${auth.token}` } : {}),
    "Content-Type": "application/json",
  };
};

export const _get = (path, options = {}) => {
  return fetch(`${path}`, {
    method: "GET",
    headers: getHeaders(),
    ...options,
  }).then((res) => handleResponse(path, res));
};

export const _post = (path, body, options = {}) => {
  return fetch(`${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
    ...options,
  }).then((res) => handleResponse(path, res));
};

export const _put = (path, body = {}, options = {}) => {
  return fetch(`${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
    ...options,
  }).then((res) => handleResponse(path, res));
};

export const _patch = (path, body = {}, options = {}) => {
  return fetch(`${path}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
    ...options,
  }).then((res) => handleResponse(path, res));
};

export const _delete = (path, body = {}, options = {}) => {
  return fetch(`${path}`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify(body),
    ...options,
  }).then((res) => handleResponse(path, res));
};

export const buildLink = (path) => {
  const auth = getAuth();
  if (auth.sub !== "anonymous") {
    //TODO better handle params
    return `${path}?token=${auth.token}`;
  }
  return path;
};
