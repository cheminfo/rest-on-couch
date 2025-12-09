import path from 'node:path';
import assert from 'node:assert';
import { expect, test, vi } from 'vitest';

import { getDbConfig, getDbConfigOrDie } from '../../../src/config/db.js';
import fs from 'node:fs';

process.stderr.write = () => {
  // ignore
};
// Avoid the call to dbConfig to crash the process
process.exit = () => {
  // ignore
};

test('process should die when there is a problem loading the database configuration', () => {
  const exit = vi.spyOn(process, 'exit');
  getDbConfigOrDie(
    path.join(import.meta.dirname, '../../homeDirectories/failDuplicateView'),
  );
  expect(exit).toHaveBeenCalledWith(1);
});

test('configuration has duplicate view name', () => {
  expect(function load() {
    return getDbConfig(
      path.join(import.meta.dirname, '../../homeDirectories/failDuplicateView'),
    );
  }).toThrow(/a view is defined more than once: viewTest/);
});

test('loading configuration that has duplicate index name', () => {
  expect(function load() {
    return getDbConfig(
      path.join(
        import.meta.dirname,
        '../../homeDirectories/failDuplicateIndex',
      ),
    );
  }).toThrow(/an index is defined more than once: indexTest/);
});

test('loading configuration that has duplicate index name', () => {
  expect(function load() {
    return getDbConfig(
      path.join(
        import.meta.dirname,
        '../../homeDirectories/failShareDesignDoc',
      ),
    );
  }).toThrow(
    /query indexes and javascript views cannot share design documents: foo/,
  );
});

test('loading configuration that has duplicate names', () => {
  expect(function load() {
    return getDbConfig(
      path.join(import.meta.dirname, '../../homeDirectories/failShareName'),
    );
  }).toThrow(/query indexes and javascript views cannot share names: test/);
});

test('loading configuration with unallowed override of the filters prop', () => {
  expect(function load() {
    return getDbConfig(
      path.join(
        import.meta.dirname,
        '../../homeDirectories/failUnallowedOverride',
      ),
    );
  }).toThrow(/^customDesign\.updates cannot be overriden$/);
});

test('loading import.js file implemented with ESM syntax', async () => {
  const dir = path.join(
    import.meta.dirname,
    '../../homeDirectories/failEsmInJsFile',
  );
  assert(fs.existsSync(dir));
  expect(() => getDbConfig(dir)).toThrow(/Unexpected token 'export'/);
});

test('failEsmWrongExport - loading import.mjs with a default export instead of named export', async () => {
  const dir = path.join(
    import.meta.dirname,
    '../../homeDirectories/failEsmWrongExport',
  );
  assert(fs.existsSync(dir));
  expect(() => getDbConfig(dir)).toThrow(
    /import.mjs must export an `importFile` function/,
  );
});
