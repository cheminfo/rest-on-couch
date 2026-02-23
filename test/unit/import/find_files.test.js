import { describe, it } from 'node:test';
import findFiles from '../../../src/import/find_files.js';
import { expect } from 'chai';
import path from 'node:path';

const homeDirNoSource = path.join(
  import.meta.dirname,
  '../../homeDirectories/find_files_no_source',
);
const homeDirWithSources = path.join(
  import.meta.dirname,
  '../../homeDirectories/find_files_with_source',
);
const sourceDir = path.join(import.meta.dirname, '../../import_sources');

describe('find files to import', () => {
  it('without sources - load files where the import.js file is', async () => {
    const files = await findFiles(homeDirNoSource, 10);
    expect(files).toMatchObject([
      {
        database: 'db1',
        importName: 'import_cjs',
        path: path.join(
          homeDirNoSource,
          'db1/import_cjs/to_process/to_import.txt',
        ),
      },
      {
        database: 'db1',
        importName: 'import_mjs',
        path: path.join(
          homeDirNoSource,
          'db1/import_mjs/to_process/to_import1.txt',
        ),
      },
      {
        database: 'db1',
        importName: 'import_mjs',
        path: path.join(
          homeDirNoSource,
          'db1/import_mjs/to_process/to_import2.txt',
        ),
      },
      {
        database: 'db2',
        importName: 'import_dir',
        path: path.join(
          homeDirNoSource,
          'db2/import_dir/to_process/to_import.txt',
        ),
      },
    ]);
  });

  it('without sources - file limit', async () => {
    const files = await findFiles(homeDirNoSource, 1);
    expect(files).toMatchObject([
      {
        database: 'db1',
        importName: 'import_cjs',
        path: path.join(
          homeDirNoSource,
          'db1/import_cjs/to_process/to_import.txt',
        ),
      },
    ]);
  });

  it('with sources', async () => {
    const files = await findFiles(homeDirWithSources, 10);
    expect(files).toMatchObject([
      {
        database: 'db1',
        importName: 'import_cjs',
        path: path.join(sourceDir, 'source1/to_process/file1.txt'),
      },
      {
        database: 'db1',
        importName: 'import_cjs',
        path: path.join(sourceDir, 'source1/to_process/file2.txt'),
      },
      {
        database: 'db1',
        importName: 'import_mjs',
        path: path.join(sourceDir, 'source2/to_process/file.txt'),
      },
      {
        database: 'db2',
        importName: 'import_dir',
        path: path.join(sourceDir, 'source3/to_process/file.txt'),
      },
    ]);
  });

  it('with sources and a low limit', async () => {
    const files = await findFiles(homeDirWithSources, 1);
    expect(files).toMatchObject([
      {
        database: 'db1',
        importName: 'import_cjs',
        path: path.join(sourceDir, 'source1/to_process/file1.txt'),
      },
    ]);
  });
});
