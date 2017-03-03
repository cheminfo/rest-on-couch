'use strict';

module.exports = async function nmrImport(ctx, result) {
    result.kind = 'sample';
    result.$id = ctx.fileName;
    result.owner = 'a@a.com';
    result.reference = ctx.fileName;
    result.field = 'field';
    result.jpath = ['jpath', 'in', 'document'];
    if(ctx.fileExt === '.txt') {
        result.content_type = 'plain/text';
    }
    result.$content = {
        sideEffect: true
    };
    result.addAttachment({
        jpath: ['other','jpath'],
        metadata: {hasMetadata: true},
        reference: 'testRef',
        contents: new Buffer('other attachment content', 'utf-8'),
        field: 'testField',
        filename: 'testFilename.txt',
        content_type: 'plain/text'
    });
    result.metadata = {
        hasMetadata: true
    };
    result.addGroup('group1');
    result.addGroups(['group2', 'group3']);

};
