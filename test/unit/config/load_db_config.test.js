import path from 'node:path';
import { it } from 'node:test';
import { expect } from 'chai';

import { getDbConfig } from '../../../src/config/db.js';

it('Can load esm config in home directory and db directory', () => {
  const dbConfig = getDbConfig(
    path.join(import.meta.dirname, '../../homeDirectories/esm_config'),
  );
  expect(dbConfig).toMatchObject({
    test_db: {
      database: 'test_db',
      password: 'password_set_in_db_config',
      adminPassword: 'adminPassword_set_in_home_config',
    },
  });
});
