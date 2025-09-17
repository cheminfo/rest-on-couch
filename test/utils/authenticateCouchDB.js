import { expect } from 'vitest';

export async function authenticateAs(agent, username, password) {
  await logout(agent);

  const loginRes = await agent
    .post('/auth/login/couchdb')
    .type('form')
    .send({ username, password });
  expect(loginRes.statusCode).toBe(200);

  const sessionRes = await agent.get('/auth/session');
  if (!sessionRes.body.authenticated) {
    throw new Error(
      `Could not authenticate on CouchDB as ${username}:${password}`,
    );
  }
}

export async function logout(agent) {
  const res = await agent.get('/auth/logout');
  expect(res.statusCode).toBe(200);
}
