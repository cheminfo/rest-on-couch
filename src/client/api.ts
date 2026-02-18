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
  const req = await apiFetch(path, options);
  return req.json();
}

export async function apiFetchJSONOptional(
  path: string,
  options: RequestInit,
): Promise<null | unknown> {
  path = path.replace(/^\/+/, '');
  const req = await apiFetch(path, options);
  if (req.status === 404) {
    return null;
  } else if (req.status < 300) {
    return req.json();
  } else {
    throw new Error(`Unexpected status code ${req.status}`);
  }
}

export function apiFetchForm(path: string, data: Record<string, string>) {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
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
  const req = await apiFetchForm(path, data);
  return req.json();
}
