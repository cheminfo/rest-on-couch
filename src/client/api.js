// root of the ROC API server
export const API_ROOT = 'http://localhost:3000/';

export function apiFetch(path, options) {
    options = Object.assign({
        mode: 'cors',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    }, options);
    return fetch(API_ROOT + path, options);
}

export async function apiFetchJSON(path, options) {
    path = path.replace(/^\/+/, '');
    const req = await apiFetch(path, options);
    return req.json();
}

export async function apiFetchForm(path, data) {
    const formData = new URLSearchParams();
    for (const key in data) {
        formData.set(key, data[key]);
    }
    return apiFetch(path, {method: 'POST', body: formData, redirect: 'manual', headers: {}});
}
