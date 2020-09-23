'use strict';

const okOrcid = require('../util/orcid');

function getZenodoDeposition(entry, self) {
  const result = {
    metadata: {
      // eslint-disable-next-line camelcase
      upload_type: 'dataset',
      title: validateString('title', entry.title),
      description: validateString('description', entry.description),
      license: validateLicense(entry.license),
      creators: validateCreators(entry.creators),
      keywords: [
        'cheminfo:roc',
        `from:${self.name}`,
        ...validateKeywords(entry.keywords),
      ],
      notes: entry.notes || '',
    },
  };
  if (entry.version) {
    result.version = entry.version;
  }
  return result;
}

function validateString(name, value) {
  if (typeof value !== 'string' || value.length < 3) {
    throw new TypeError(`${name} must have at least three characters`);
  }
  return value;
}

function validateLicense(license = 'ODC-BY-1.0') {
  if (typeof license !== 'string') {
    throw new TypeError('license must be a string');
  }
  return license;
}

function validateCreators(creators) {
  if (!Array.isArray(creators)) {
    throw new TypeError('creators must be an array');
  }
  if (creators.length === 0) {
    throw new TypeError('there must be at least one creator');
  }
  const toReturn = [];
  for (const creator of creators) {
    let creatorName;
    if (typeof creator.name === 'string') {
      if (!creator.name.includes(', ')) {
        throw new TypeError(
          'creator must have a lastname and firstname, comma-separated',
        );
      }
      creatorName = creator.name;
    } else if (
      typeof creator.firstname === 'string' &&
      typeof creator.lastname === 'string'
    ) {
      creatorName = `${creator.lastname}, ${creator.firstname}`;
    } else {
      throw new TypeError(
        'creator must have a lastname and firstname, comma-separated',
      );
    }
    if (typeof creator.affiliation !== 'string') {
      throw new TypeError('creator must have an affiliation');
    }

    const creatorToReturn = {
      name: creatorName,
      affiliation: creator.affiliation,
    };

    if ('orcid' in creator) {
      if (okOrcid(creator.orcid)) {
        creatorToReturn.orcid = creator.orcid;
      } else {
        throw new TypeError(`${creator.orcid} is not a valid ORCID identifier`);
      }
    }
    toReturn.push(creatorToReturn);
  }
  return toReturn;
}

function validateKeywords(keywords = []) {
  if (!Array.isArray(keywords)) {
    throw new TypeError('keywords must be an array');
  }
  for (const keyword of keywords) {
    if (typeof keyword !== 'string') {
      throw new TypeError('keywords must all be strings');
    }
  }
  return keywords;
}

module.exports = getZenodoDeposition;
