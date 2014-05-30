// ---------------------------------------------------------------------------------------------------------------------
// Unit tests for trim()
//
// @module test/trim.spec
// ---------------------------------------------------------------------------------------------------------------------
/* globals describe, it, before */
// jshint multistr: true

var assert = require('assert');

var trim = require('../header-parse').trim;

// ---------------------------------------------------------------------------------------------------------------------

var leading_space = '   This value has some leading spaces.';
var leading_space_expected = 'This value has some leading spaces.';

var leading_tab = '\t\t\tThis value has some leading tabs.';
var leading_tab_expected = 'This value has some leading tabs.';

var trailing_space = 'This value has some trailing spaces.   ';
var trailing_space_expected = 'This value has some trailing spaces.';

var trailing_tab = 'This value has some trailing tabs.\t\t\t';
var trailing_tab_expected = 'This value has some trailing tabs.';

var internal_space = 'This value has some    repeated internal spaces.';

var internal_tab = 'This value has some\t\t\trepeated internal tabs.';

var failing = ' Basic\r\n\tQWxhZGRpbjpvcGVuIHNlc2FtZQ==';
var failing_expected = 'Basic\r\n\tQWxhZGRpbjpvcGVuIHNlc2FtZQ==';

// ---------------------------------------------------------------------------------------------------------------------

var options;

var sharedTests = {
    'removes leading spaces': function()
    {
        var result = trim(leading_space, options);

        assert.strictEqual(result, leading_space_expected);
    },

    'removes leading tabs': function()
    {
        var result = trim(leading_tab, options);

        assert.strictEqual(result, leading_tab_expected);
    },

    'removes trailing spaces': function()
    {
        var result = trim(trailing_space, options);

        assert.strictEqual(result, trailing_space_expected);
    },

    'removes trailing tabs': function()
    {
        var result = trim(trailing_tab, options);

        assert.strictEqual(result, trailing_tab_expected);
    },

    'does not remove repeated internal spaces': function()
    {
        var result = trim(internal_space, options);

        assert.strictEqual(result, internal_space);
    },

    'does not remove repeated internal tabs': function()
    {
        var result = trim(internal_tab, options);

        assert.strictEqual(result, internal_tab);
    },

    'fixes failing case': function()
    {
        var result = trim(failing, options);

        assert.strictEqual(result, failing_expected);
    },
};

describe('trim()', function()
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
    }); // end describe 'in lenient mode'
}); // end describe '.trim()'
