const location = window.location;

export let API_ROOT: string;
if (import.meta.env.PROD) {
  API_ROOT = location.origin + location.pathname;
} else {
  API_ROOT = location.origin.replace(/:\d+/, `:3300`) + location.pathname;
}

export function apiFetch(path: string, options: RequestInit) {
  options = {
    mode: 'cors',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...options,
  };
  return fetch(`${API_ROOT}${path}`, options);
}

export async function apiFetchJSON(
  path: string,
  options: RequestInit,
): Promise<unknown> {
  path = path.replace(/^\/+/, '');
  const request = await apiFetch(path, options);
  return request.json();
}

export async function apiFetchJSONOptional(
  path: string,
  options: RequestInit,
): Promise<null | unknown> {
  path = path.replace(/^\/+/, '');
  const request = await apiFetch(path, options);
  if (request.status === 404) {
    return null;
  }
  if (request.status < 300) {
    return request.json();
  }
  throw new Error(`Unexpected status code ${request.status}`);
}

export function apiFetchForm(path: string, data: Record<string, string>) {
  const formData = new URLSearchParams(data);
  return apiFetch(path, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
    headers: {},
  });
}

export async function apiFetchFormJSON(
  path: string,
  data: Record<string, string>,
): Promise<unknown> {
  const request = await apiFetchForm(path, data);
  return request.json();
}
