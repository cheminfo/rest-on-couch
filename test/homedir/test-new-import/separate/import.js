'use strict';

module.exports = async function nmrImport(ctx, result) {
    result.kind = 'sample';
    result.id = 'separate';
    result.owner = 'a@a.com';
    result.reference = ctx.filename;
    result.skipAttachment();
    result.skipMetadata();
    result.field = 'field';
    if(ctx.fileExt === '.txt') {
        result.content_type = 'plain/text';
    }
    result.content = {
        sideEffect: true
    };
    result.addAttachment({
        jpath: ['other','jpath'],
        metadata: {hasMetadata: true},
        reference: 'testRef',
        contents: await ctx.getContents(),
        field: 'testField',
        filename: ctx.filename,
        content_type: 'plain/text'
    });
    result.metadata = {
        hasMetadata: true
    };
    result.addGroup('group1');
    result.addGroups(['group2', 'group3']);
};
