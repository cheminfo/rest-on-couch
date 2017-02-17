'use strict';

// module.exports = function (BaseImport) {
//     class NMRImport extends BaseImport {
//         async process() {
//             if (!this.fileName.endsWith('dx')) {
//                 return this.skip();
//             }
//         }
//     }
//
//     return NMRImport;
// };

module.exports = async function nmrImport(ctx, result) {
    if (!ctx.fileName.endsWith('dx')) {
        return result.skip();
    }

    const nmr = await ctx.getContents('latin1');

    result.kind = 'sample';
    result.id = ['123456', 'f1'];
    result.owner = ['a@test.com', 'group1'];


};
