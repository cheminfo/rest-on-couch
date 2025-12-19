export const globalConfigSymbol = Symbol('global_config');

export function getConfigGlobal() {
  return global[globalConfigSymbol];
}
