// ---------------------------------------------------------------------------------------------------------------------
// Unit tests for extractHeaderBlock()
//
// @module test/extractHeaderBlock.spec
// ---------------------------------------------------------------------------------------------------------------------
/* globals describe, it, before */
// jshint multistr: true

var assert = require('assert');

var extractHeaderBlock = require('../header-parse').extractHeaderBlock;

// ---------------------------------------------------------------------------------------------------------------------

var strict_doc = 'Title: A simple document containing meta-headers\r\n\
CSS: style.css\r\n\
\r\n\
# A simple document containing meta-headers #\r\n\
\r\n\
Content of the document!\r\n';
var strict_doc_expected = {
    headerBlock: 'Title: A simple document containing meta-headers\r\nCSS: style.css\r\n',
    body: '# A simple document containing meta-headers #\r\n\r\nContent of the document!\r\n',
    headers: {
        Title: 'A simple document containing meta-headers',
        CSS: 'style.css',
    },
};

var lenient_doc = strict_doc.replace(/\r\n/g, '\n');
var lenient_doc_expected = {
    headerBlock: 'Title: A simple document containing meta-headers\nCSS: style.css\n',
    body: '# A simple document containing meta-headers #\n\nContent of the document!\n',
    headers: {
        Title: 'A simple document containing meta-headers',
        CSS: 'style.css',
    },
};

var mixed_header_doc = 'Title: A simple document containing meta-headers\n\
CSS: style.css\r\n\
\r\n\
# A simple document containing meta-headers #\r\n\
\r\n\
Content of the document!\r\n';
var mixed_header_doc_expected = {
    headerBlock: 'Title: A simple document containing meta-headers\nCSS: style.css\r\n',
    body: '# A simple document containing meta-headers #\r\n\r\nContent of the document!\r\n',
    headers: {
        Title: 'A simple document containing meta-headers',
        CSS: 'style.css',
    },
};

var mixed_body_doc = 'Title: A simple document containing meta-headers\r\n\
CSS: style.css\r\n\
\r\n\
# A simple document containing meta-headers #\n\
\r\n\
Content of the document!\n';
var mixed_body_doc_expected = {
    headerBlock: 'Title: A simple document containing meta-headers\r\nCSS: style.css\r\n',
    body: '# A simple document containing meta-headers #\n\r\nContent of the document!\n',
    headers: {
        Title: 'A simple document containing meta-headers',
        CSS: 'style.css',
    },
};

// ---------------------------------------------------------------------------------------------------------------------

var options;

var sharedTests = {
    'parses a basic document using CRLF newlines': function()
    {
        var result = extractHeaderBlock(strict_doc, options);

        assert.deepEqual(result, strict_doc_expected);
    },
};

describe('extractHeaderBlock()', function()
{
    describe('in strict mode', function()
    {
        before(function()
        {
            options = {strict: true};
        });

        for(var desc in sharedTests)
        {
            it(desc, sharedTests[desc]);
        } // end for

        it('doesn\'t parse a basic document using LF newlines', function()
        {
            var result = extractHeaderBlock(lenient_doc, options);

            assert.deepEqual(result, {body: lenient_doc});
        });

        it('doesn\'t parse a document using mixed LF and CRLF newlines in the header', function()
        {
            var result = extractHeaderBlock(mixed_header_doc, options);

            assert.deepEqual(result, {body: mixed_header_doc});
        });

        it('parses a document using mixed LF and CRLF newlines in the body', function()
        {
            var result = extractHeaderBlock(mixed_body_doc, options);

            assert.deepEqual(result, mixed_body_doc_expected);
        });
    }); // end describe 'in strict mode'

    describe('in lenient mode', function()
    {
        before(function()
        {
            options = {};
        });

        for(var desc in sharedTests)
        {
            it(desc, sharedTests[desc]);
        } // end for

        it('parses a basic document using LF newlines', function()
        {
            var result = extractHeaderBlock(lenient_doc, options);

            assert.deepEqual(result, lenient_doc_expected);
        });

        it('parses a document using mixed LF and CRLF newlines in the header', function()
        {
            var result = extractHeaderBlock(mixed_header_doc, options);

            assert.deepEqual(result, mixed_header_doc_expected);
        });

        it('parses a document using mixed LF and CRLF newlines in the body', function()
        {
            var result = extractHeaderBlock(mixed_body_doc, options);

            assert.deepEqual(result, mixed_body_doc_expected);
        });
    }); // end describe 'in lenient mode'
}); // end describe '.extractHeaderBlock()'
