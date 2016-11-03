// root of the ROC API server
export const API_ROOT = 'http://localhost:3000/';

export function apiFetch(path, options) {
    options = Object.assign({
        mode: 'cors',
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    }, options);
    return fetch(API_ROOT + path, options);
}

export async function apiFetchJSON(path, options) {
    const req = await apiFetch(path, options);
    return req.json();
}
