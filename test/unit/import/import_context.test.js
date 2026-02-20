import fs from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import ImportContext from '../../../src/import/ImportContext.mjs';
import { resetDatabase } from '../../utils/utils.js';

const databaseName = 'test-new-import';

describe('ImportContext', () => {
  beforeEach(async () => {
    await resetDatabase(databaseName);
  });
  it('should instantiate a new import context', async () => {
    const file = path.join(
      import.meta.dirname,
      '../../homeDirectories/main/test-new-import/full/to_process/test.txt',
    );
    const fileContents = await fs.readFileSync(file, 'utf-8');
    const ctx = new ImportContext(file, databaseName);
    expect(ctx.filename).toBe('test.txt');
    expect(ctx.fileExt).toBe('.txt');
    expect(ctx.fileDir).toMatch(
      path.normalize('homeDirectories/main/test-new-import/full/to_process'),
    );
    expect(ctx.couch).toBeDefined();
    await ctx.couch.open();
    const fileContentsUtf8 = await ctx.getContents('utf-8');
    expect(fileContentsUtf8).toBe(fileContents);

    const dataBuffer = await ctx.getContents();
    expect(dataBuffer).toEqual(Buffer.from(fileContents, 'utf-8'));
  });
});
