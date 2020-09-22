'use strict';

function generateCheckDigit(noHyphenOrcid) {
  // https://support.orcid.org/hc/en-us/articles/360006897674-Structure-of-the-ORCID-Identifier
  let total = 0;
  let zero = '0'.charCodeAt(0);
  for (let i = 0; i < 15; i++) {
    let digit = noHyphenOrcid.charCodeAt(i) - zero;
    total = (total + digit) * 2;
  }
  let result = (12 - (total % 11)) % 11;
  return result === 10 ? 'X' : String(result);
}

function okOrcid(orcid) {
  // based on https://github.com/zimeon/orcid-feed-js
  if (typeof orcid !== 'string') {
    return false;
  }
  let noHyphenOrcid = orcid.replace(
    /^(\d{4})-(\d{4})-(\d{4})-(\d\d\d[\dX])$/,
    '$1$2$3$4',
  );
  if (noHyphenOrcid === orcid) {
    return false;
  }
  if (noHyphenOrcid.charAt(15) !== generateCheckDigit(noHyphenOrcid)) {
    return false;
  }
  return true;
}

module.exports = okOrcid;
