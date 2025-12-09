import { setTimeout as wait } from 'node:timers/promises';

const COUCHDB_HOST = process.env.COUCHDB_HOST || 'localhost';
const COUCHDB_PORT = process.env.COUCHDB_PORT || 5984;

const COUCHDB_URL = `http://${COUCHDB_HOST}:${COUCHDB_PORT}`;

const maxTries = 3;
let tries = 0;

//  CouchDB takes some time to start. We have to wait before setting it up.
while (!(await isCouchReady())) {
  tries++;
  console.log('CouchDB is starting up...');
  if (tries >= maxTries) {
    throw new Error('CouchDB did not start in time');
  }
  await wait(5_000);
}

await couchRequest('POST', '/_cluster_setup', {
  action: 'finish_cluster',
});

await couchRequest('PUT', '/_users/org.couchdb.user:a@a.com', {
  password: '123',
  type: 'user',
  name: 'a@a.com',
  roles: [],
});
await couchRequest('PUT', '/_users/org.couchdb.user:b@b.com', {
  password: '123',
  type: 'user',
  name: 'b@b.com',
  roles: [],
});
await couchRequest('PUT', '/_users/org.couchdb.user:admin@a.com', {
  password: '123',
  type: 'user',
  name: 'admin@a.com',
  roles: [],
});
await couchRequest('PUT', '/_users/org.couchdb.user:rest-on-couch', {
  password: 'roc-123',
  type: 'user',
  name: 'rest-on-couch',
  roles: [],
});

await couchRequest('PUT', '/test');

async function isCouchReady() {
  try {
    const response = await couchRequest('GET', '/_users');
    return response.status === 200 || response.status === 404;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function couchRequest(method, path, body) {
  return fetch(`${COUCHDB_URL}${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from('admin:admin').toString('base64')}`,
    },
  });
}
