'use strict';

const klaw = require('klaw');
const path = require('node:path');
const fs = require('fs-extra');
const requireImportScript = require('../config/require_import_script');

module.exports = async function findFiles(homeDir, limit, sortWalk = 'shift') {
  let files = [];

  const databases = await fs.readdir(homeDir);

  for (const database of databases) {
    if (shouldIgnore(database)) continue;
    const databasePath = path.join(homeDir, database);
    const stat = await fs.stat(databasePath);
    if (!stat.isDirectory()) continue;

    const importNames = await fs.readdir(databasePath);
    for (const importName of importNames) {
      if (shouldIgnore(importName)) continue;
      const importNamePath = path.join(databasePath, importName);
      const stat = await fs.stat(importNamePath);
      if (!stat.isDirectory()) continue;

      try {
        const importConfig = requireImportScript(importNamePath);
        if (importConfig && Array.isArray(importConfig.source)) {
          for (const source of importConfig.source) {
            try {
              const sourcePath = path.resolve(importNamePath, source);
              const sourceToProcessPath = path.join(sourcePath, 'to_process');
              const stat = await fs.stat(sourceToProcessPath);
              if (stat.isDirectory()) {
                const maxElements = limit > 0 ? limit - files.length : 0;
                const fileList = await getFilesToProcess(
                  sourceToProcessPath,
                  maxElements,
                  sortWalk,
                );
                const objFiles = fileList.map((file) => ({
                  database,
                  importName,
                  path: file,
                }));
                files = files.concat(objFiles);
                if (limit > 0 && files.length >= limit) {
                  return files;
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const toProcessPath = path.join(importNamePath, 'to_process');
        const stat = await fs.stat(toProcessPath);
        if (stat.isDirectory()) {
          const maxElements = limit > 0 ? limit - files.length : 0;
          const fileList = await getFilesToProcess(
            toProcessPath,
            maxElements,
            sortWalk,
          );
          const objFiles = fileList.map((file) => ({
            database,
            importName,
            path: file,
          }));
          files = files.concat(objFiles);
          if (limit > 0 && files.length >= limit) {
            return files;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return files;
};

function getFilesToProcess(directory, maxElements, sortWalk) {
  return new Promise((resolve, reject) => {
    const items = [];
    const walkStream = klaw(directory, { queueMethod: sortWalk });
    walkStream
      .on('data', function onData(item) {
        if (item.stats.isFile()) {
          items.push(item.path);
          if (maxElements > 0 && items.length >= maxElements) {
            // eslint-disable-next-line no-invalid-this
            this.pause();
            resolve(items);
          }
        }
      })
      .on('end', () => resolve(items))
      .on('error', function onError(err) {
        // eslint-disable-next-line no-invalid-this
        this.close();
        reject(err);
      });
  });
}

function shouldIgnore(name) {
  return name === 'node_modules' || name.startsWith('.');
}
