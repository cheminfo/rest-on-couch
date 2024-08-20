const location = window.location;

let API_ROOT;
if (import.meta.env.prod) {
  API_ROOT = location.origin + location.pathname;
} else {
  API_ROOT = location.origin.replace(/:\d+/, `:${3000}`) + location.pathname;
}

export { API_ROOT };

export function apiFetch(path, options) {
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

export async function apiFetchJSON(path, options) {
  path = path.replace(/^\/+/, '');
  const req = await apiFetch(path, options);
  return req.json();
}

export async function apiFetchJSONOptional(path, options) {
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

export function apiFetchForm(path, data) {
  const formData = new URLSearchParams();
  for (const key in data) {
    formData.set(key, data[key]);
  }
  return apiFetch(path, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
    headers: {},
  });
}

export async function apiFetchFormJSON(path, data) {
  const req = await apiFetchForm(path, data);
  return req.json();
}
