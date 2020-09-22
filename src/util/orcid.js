function generateCheckDigit(noHyphenORCID) {
  // Generates check digit as per ISO 7064 11,2 for 15 digit string
  // http://support.orcid.org/knowledgebase/articles/116780-structure-of-the-orcid-identifier
  let total = 0;
  let zero = '0'.charCodeAt(0);
  for (let i = 0; i < 15; i++) {
    let digit = noHyphenORCID.charCodeAt(i) - zero;
    total = (total + digit) * 2;
  }
  let result = (12 - (total % 11)) % 11;
  return result == 10 ? 'X' : String(result);
}

function okORCID(orcid) {
  if (typeof orcid !== 'string') {
    return false;
  }
  let noHyphenORCID = orcid.replace(
    /^(\d{4})-(\d{4})-(\d{4})-(\d\d\d[\dX])$/,
    '$1$2$3$4',
  );
  if (noHyphenORCID == orcid) {
    // will not match if replace succeeded
    return false;
  }
  if (noHyphenORCID.charAt(15) != generateCheckDigit(noHyphenORCID)) {
    return false;
  }
  return true;
}

module.exports = okORCID;
