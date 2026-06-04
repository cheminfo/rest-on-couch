export async function couchV1SkipMessage() {
  const version = await getVersion();
  if (version.startsWith('1.')) {
    return 'Test unsupported by CouchDB v1';
  }
}

export async function getCouchMajorVersion() {
  const version = await getVersion();
  return parseInt(version[0], 10);
}

export const getVersion = (() => {
  let version;
  return function getVersion() {
    if (!version) {
      version = fetch(process.env.REST_ON_COUCH_URL)
        .then((couchRes) => couchRes.json())
        .then((value) => value.version);
    }
    return version;
  };
})();
