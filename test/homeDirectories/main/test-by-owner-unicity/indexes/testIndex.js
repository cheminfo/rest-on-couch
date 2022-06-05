'use strict';

module.exports = {
  modDate: {
    index: {
      fields: [
        {
          '\\$modificationDate': 'asc',
        },
      ],
      partial_filter_selector: {
        '\\$kind': {
          $eq: 'sample',
        },
      },
    },
    type: 'json',
    ddoc: 'modDateIndex',
  },
};
