export default async function saveResult(importBase, result) {
  const couch = importBase.couch;
  const files = result.getAnalyses();

  // Create the new document if it does not exist
  let document = await couch.ensureExistsOrCreateEntry(
    result.id,
    result.owner,
    {
      kind: result.kind,
      owners: result.groups,
    },
  );

  // In case the document already existed, we need update the list of owners
  if (result.groups.length) {
    document = await couch.addOwnersToDoc(
      document.id,
      result.owner,
      result.groups,
      'entry',
    );
  }

  await couch.addFileToJpath(result.id, result.owner, files, result.content);

  return document.id;
}
