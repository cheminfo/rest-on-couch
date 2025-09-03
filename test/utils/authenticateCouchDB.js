import { expect } from 'vitest';

export default function authenticateCouchDB(agent, username, password) {
  return agent.get('/auth/logout').then((res) => {
    expect(res.statusCode).toBe(200);
    return agent
      .post('/auth/login/couchdb')
      .type('form')
      .send({ username, password })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return agent.get('/auth/session');
      })
      .then((res) => {
        if (!res.body.authenticated) {
          throw new Error(
            `Could not authenticate on CouchDB as ${username}:${password}`,
          );
        }
      });
  });
}
