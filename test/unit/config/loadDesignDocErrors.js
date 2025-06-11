'use strict';

const path = require('path');

const { getDbConfig, getDbConfigOrDie } = require('../../../src/config/db');

process.stderr.write = () => {
  // ignore
};
// Avoid the call to dbConfig to crash the process
process.exit = () => {
  // ignore
};
test('process should die when there is a problem loading the database configuration', () => {
  const exit = jest.spyOn(process, 'exit');
  getDbConfigOrDie(
    path.join(__dirname, '../../homeDirectories/failDuplicateView'),
  );
  expect(exit).toHaveBeenCalledWith(1);
});

test('configuration has duplicate view name', () => {
  expect(function load() {
    return getDbConfig(
      path.join(__dirname, '../../homeDirectories/failDuplicateView'),
    );
  }).toThrow(/a view is defined more than once: viewTest/);
});

test('loading configuration that has duplicate index name', () => {
  expect(function load() {
    return getDbConfig(
      path.join(__dirname, '../../homeDirectories/failDuplicateIndex'),
    );
  }).toThrow(/an index is defined more than once: indexTest/);
});

test('loading configuration that has duplicate index name', () => {
  expect(function load() {
    return getDbConfig(
      path.join(__dirname, '../../homeDirectories/failShareDesignDoc'),
    );
  }).toThrow(
    /query indexes and javascript views cannot share design documents: foo/,
  );
});

test('loading configuration that has duplicate names', () => {
  expect(function load() {
    return getDbConfig(
      path.join(__dirname, '../../homeDirectories/failShareName'),
    );
  }).toThrow(/query indexes and javascript views cannot share names: test/);
});

test('loading configuration with unallowed override of the filters prop', () => {
  expect(function load() {
    return getDbConfig(
      path.join(__dirname, '../../homeDirectories/failUnallowedOverride'),
    );
  }).toThrow(/^customDesign\.updates cannot be overriden$/);
});
