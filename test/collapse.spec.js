// ---------------------------------------------------------------------------------------------------------------------
// Unit tests for collapse()
//
// @module test/collapse.spec
// ---------------------------------------------------------------------------------------------------------------------
/* globals describe, it, before */
// jshint multistr: true

var assert = require('assert');

var collapse = require('../header-parse').collapse;

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
var internal_space_expected = 'This value has some repeated internal spaces.';

var internal_tab = 'This value has some\t\t\trepeated internal tabs.';
var internal_tab_expected = 'This value has some repeated internal tabs.';


var strict_space_folded = 'This sentence is folded\r\n\
 using CRLF and a space.';
var strict_space_folded_expected = 'This sentence is folded using CRLF and a space.';

var strict_tab_folded = 'This sentence is folded\r\n\
\tusing CRLF and a tab.';
var strict_tab_folded_expected = 'This sentence is folded using CRLF and a tab.';

var strict_not_folded = 'This is not a valid fold;\n\
the CRLF should not be unfolded.';


var lenient_space_folded = 'This sentence is folded\n\
 using LF and a space.';
var lenient_space_folded_expected = 'This sentence is folded using LF and a space.';

var lenient_tab_folded = 'This sentence is folded\n\
\tusing LF and a tab.';
var lenient_tab_folded_expected = 'This sentence is folded using LF and a tab.';
var lenient_tab_folded_strict_collapsed_expected = 'This sentence is folded\n\
 using LF and a tab.';

var lenient_not_folded = 'This is not a valid fold;\n\
the LF should not be unfolded.';

// ---------------------------------------------------------------------------------------------------------------------

var options;

var sharedTests = {
    'collapses leading spaces': function()
    {
        var result = collapse(leading_space, options);

        assert.strictEqual(result, leading_space_expected);
    },

    'collapses leading tabs': function()
    {
        var result = collapse(leading_tab, options);

        assert.strictEqual(result, leading_tab_expected);
    },


    'collapses trailing spaces': function()
    {
        var result = collapse(trailing_space, options);

        assert.strictEqual(result, trailing_space_expected);
    },

    'collapses trailing tabs': function()
    {
        var result = collapse(trailing_tab, options);

        assert.strictEqual(result, trailing_tab_expected);
    },


    'collapses repeated internal spaces': function()
    {
        var result = collapse(internal_space, options);

        assert.strictEqual(result, internal_space_expected);
    },

    'collapses repeated internal tabs': function()
    {
        var result = collapse(internal_tab, options);

        assert.strictEqual(result, internal_tab_expected);
    },


    'unfolds a line folded using CRLF and a space': function()
    {
        var result = collapse(strict_space_folded, options);

        assert.strictEqual(result, strict_space_folded_expected);
    },

    'unfolds a line folded using CRLF and a tab': function()
    {
        var result = collapse(strict_tab_folded, options);

        assert.strictEqual(result, strict_tab_folded_expected);
    },


    'does not unfold two lines delineated by LF with no leading space or tab': function()
    {
        var result = collapse(lenient_not_folded, options);

        assert.strictEqual(result, lenient_not_folded);
    },

    'does not unfold two lines delineated by CRLF with no leading space or tab': function()
    {
        var result = collapse(strict_not_folded, options);

        assert.strictEqual(result, strict_not_folded);
    },
};

describe('collapse()', function()
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


        it('does not unfold a line folded using LF and a space', function()
        {
            var result = collapse(lenient_space_folded, options);

            assert.strictEqual(result, lenient_space_folded);
        });

        it('does not unfold a line folded using LF and a tab, but still replaces the tab', function()
        {
            var result = collapse(lenient_tab_folded, options);

            assert.strictEqual(result, lenient_tab_folded_strict_collapsed_expected);
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


        it('unfolds a line folded using LF and a space', function()
        {
            var result = collapse(lenient_space_folded, options);

            assert.strictEqual(result, lenient_space_folded_expected);
        });

        it('unfolds a line folded using LF and a tab', function()
        {
            var result = collapse(lenient_tab_folded, options);

            assert.strictEqual(result, lenient_tab_folded_expected);
        });
    }); // end describe 'in lenient mode'
}); // end describe '.collapse()'
