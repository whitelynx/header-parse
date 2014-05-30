// ---------------------------------------------------------------------------------------------------------------------
// Unit tests for parseHeaders()
//
// @module test/parseHeaders.spec
// ---------------------------------------------------------------------------------------------------------------------
/* globals describe, it, before */
// jshint multistr: true

var assert = require('assert');

var parseHeaders = require('../header-parse').parseHeaders;

// ---------------------------------------------------------------------------------------------------------------------

var basic = 'Proxy-Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var basic_expected = {'Proxy-Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='};

var strict_multiple_headers = 'Accept: text/plain\r\n\
Content-Type: application/x-www-form-urlencoded\r\n\
Proxy-Authorization: Basic\r\n\
 QWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var lenient_multiple_headers = 'Accept: text/plain\n\
Content-Type: application/x-www-form-urlencoded\n\
Proxy-Authorization: Basic\n\
 QWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var multiple_headers_expected = {
    'Accept': 'text/plain',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Proxy-Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
};

var strict_space_folded = 'Proxy-Authorization: Basic\r\n\
 QWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var lenient_space_folded = 'Proxy-Authorization: Basic\n\
 QWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var space_folded_expected = {'Proxy-Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='};
var space_folded_expected_noTrim = {'Proxy-Authorization': ' Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='};

var strict_tab_folded = 'Proxy-Authorization: Basic\r\n\
\tQWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var lenient_tab_folded = 'Proxy-Authorization: Basic\n\
\tQWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var tab_folded_expected = {'Proxy-Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='};
var tab_folded_expected_noCollapse = {'Proxy-Authorization': 'Basic\tQWxhZGRpbjpvcGVuIHNlc2FtZQ=='};
var tab_folded_expected_noTrim = {'Proxy-Authorization': ' Basic\tQWxhZGRpbjpvcGVuIHNlc2FtZQ=='};
var strict_tab_folded_expected_noUnfold = {'Proxy-Authorization': 'Basic\r\n\
\tQWxhZGRpbjpvcGVuIHNlc2FtZQ=='};
var lenient_tab_folded_expected_noUnfold = {'Proxy-Authorization': 'Basic\n\
\tQWxhZGRpbjpvcGVuIHNlc2FtZQ=='};

var strict_invalid_header = 'Accept: text/plain\r\n\
This is an invalid header!\r\n\
Content-Type: application/x-www-form-urlencoded';
var lenient_invalid_header = 'Accept: text/plain\n\
This is an invalid header!\n\
Content-Type: application/x-www-form-urlencoded';
var invalid_header_expected = {
    'Accept': 'text/plain',
    'Content-Type': 'application/x-www-form-urlencoded',
};

// ---------------------------------------------------------------------------------------------------------------------

var options = {};
/*
Defaults:
options = {
    strict: false,
    collapse: true,
    trim: true,
    unfold: true,
};
*/

var sharedTests = {
    'parses a basic header': function()
    {
        var result = parseHeaders(basic, options);

        assert.deepEqual(result, basic_expected);
    },

    'parses multiple headers using CRLF newlines': function()
    {
        var result = parseHeaders(strict_multiple_headers, options);

        assert.deepEqual(result, multiple_headers_expected);
    },

    'parses header with a value folded using CRLF and a space': function()
    {
        var result = parseHeaders(strict_space_folded, options);

        assert.deepEqual(result, space_folded_expected);
    },

    'parses header with a value folded using CRLF and a space, without trimming': function()
    {
        options.collapse = false;
        options.trim = false;

        var result = parseHeaders(strict_space_folded, options);

        // Clean up options changes
        delete options.collapse;
        delete options.trim;

        assert.deepEqual(result, space_folded_expected_noTrim);
    },

    'parses header with a value folded using CRLF and a tab': function()
    {
        var result = parseHeaders(strict_tab_folded, options);

        assert.deepEqual(result, tab_folded_expected);
    },

    'parses header with a value folded using CRLF and a tab, without collapsing': function()
    {
        options.collapse = false;

        var result = parseHeaders(strict_tab_folded, options);

        // Clean up options changes
        delete options.collapse;

        assert.deepEqual(result, tab_folded_expected_noCollapse);
    },

    'parses header with a value folded using CRLF and a tab, without trimming': function()
    {
        options.collapse = false;
        options.trim = false;

        var result = parseHeaders(strict_tab_folded, options);

        // Clean up options changes
        delete options.collapse;
        delete options.trim;

        assert.deepEqual(result, tab_folded_expected_noTrim);
    },

    'parses header with a value folded using CRLF and a tab, without unfolding': function()
    {
        options.collapse = false;
        options.unfold = false;

        var result = parseHeaders(strict_tab_folded, options);

        // Clean up options changes
        delete options.collapse;
        delete options.unfold;

        assert.deepEqual(result, strict_tab_folded_expected_noUnfold);
    },
};

describe('parseHeaders()', function()
{
    describe('in strict mode', function()
    {
        before(function()
        {
            options.strict = true;
        });

        for(var desc in sharedTests)
        {
            it(desc, sharedTests[desc]);
        } // end for

        it('throws an error on multiple headers using LF newlines', function()
        {
            assert.throws(function()
            {
                parseHeaders(lenient_multiple_headers, options);
            });
        });

        it('throws an error on header with a value folded using LF and a space', function()
        {
            assert.throws(function()
            {
                parseHeaders(lenient_space_folded, options);
            });
        });

        it('throws an error on header with a value folded using LF and a tab', function()
        {
            assert.throws(function()
            {
                parseHeaders(lenient_tab_folded, options);
            });
        });
    }); // end describe 'in strict mode'

    describe('in lenient mode', function()
    {
        before(function()
        {
            options.strict = false;
        });

        for(var desc in sharedTests)
        {
            it(desc, sharedTests[desc]);
        } // end for

        it('parses multiple headers using LF newlines', function()
        {
            var result = parseHeaders(lenient_multiple_headers, options);

            assert.deepEqual(result, multiple_headers_expected);
        });

        it('parses header with a value folded using LF and a space', function()
        {
            var result = parseHeaders(lenient_space_folded, options);

            assert.deepEqual(result, space_folded_expected);
        });

        it('parses header with a value folded using LF and a space, without trimming', function()
        {
            options.collapse = false;
            options.trim = false;

            var result = parseHeaders(lenient_space_folded, options);

            // Clean up options changes
            delete options.collapse;
            delete options.trim;

            assert.deepEqual(result, space_folded_expected_noTrim);
        });

        it('parses header with a value folded using LF and a tab', function()
        {
            var result = parseHeaders(lenient_tab_folded, options);

            assert.deepEqual(result, tab_folded_expected);
        });

        it('parses header with a value folded using LF and a tab, without collapsing', function()
        {
            options.collapse = false;

            var result = parseHeaders(lenient_tab_folded, options);

            // Clean up options changes
            delete options.collapse;

            assert.deepEqual(result, tab_folded_expected_noCollapse);
        });

        it('parses header with a value folded using LF and a tab, without trimming', function()
        {
            options.collapse = false;
            options.trim = false;

            var result = parseHeaders(lenient_tab_folded, options);

            // Clean up options changes
            delete options.collapse;
            delete options.trim;

            assert.deepEqual(result, tab_folded_expected_noTrim);
        });

        it('parses header with a value folded using LF and a tab, without unfolding', function()
        {
            options.collapse = false;
            options.unfold = false;

            var result = parseHeaders(lenient_tab_folded, options);

            // Clean up options changes
            delete options.collapse;
            delete options.unfold;

            assert.deepEqual(result, lenient_tab_folded_expected_noUnfold);
        });
    }); // end describe 'in lenient mode'
}); // end describe '.parseHeaders()'
