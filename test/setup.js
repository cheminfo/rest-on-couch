import {
  JestAsymmetricMatchers,
  JestChaiExpect,
  JestExtend,
} from '@vitest/expect';
import * as chai from 'chai';
import { globalConfigSymbol } from '../src/config/global.mjs';

// allows using expect.extend instead of chai.use to extend plugins
chai.use(JestExtend);
// adds all jest matchers to expect
chai.use(JestChaiExpect);
// adds asymmetric matchers like stringContaining, objectContaining
chai.use(JestAsymmetricMatchers);

// Global parameters we do not want to repeat in every configuration file
global[globalConfigSymbol] = {
  keys: ['app-key'],
  username: 'rest-on-couch',
  password: 'roc-123',
  adminPassword: 'admin',
};
