// Same simple import function as "noReference"
export default function esmImport(ctx, result) {
  result.kind = 'sample';
  result.id = 'esm_import';
  result.reference = 'esm_import';
  result.owner = 'a@a.com';
  result.jpath = ['main', 'jpath'];
  result.field = 'field';
  result.metadata = {
    noRefMetadata: true,
  };
}
