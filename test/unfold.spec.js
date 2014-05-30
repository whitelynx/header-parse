// ---------------------------------------------------------------------------------------------------------------------
// Unit tests for unfold()
//
// @module test/unfold.spec
// ---------------------------------------------------------------------------------------------------------------------
/* globals describe, it, before */
// jshint multistr: true

var assert = require('assert');

var unfold = require('../header-parse').unfold;

// ---------------------------------------------------------------------------------------------------------------------

var strict_space_folded = 'This sentence is folded\r\n\
 using CRLF and a space.';
var strict_space_folded_expected = 'This sentence is folded using CRLF and a space.';

var strict_tab_folded = 'This sentence is folded\r\n\
\tusing CRLF and a tab.';
var strict_tab_folded_expected = 'This sentence is folded\tusing CRLF and a tab.';

var strict_not_folded = 'This is not a valid fold;\n\
the CRLF should not be unfolded.';


var lenient_space_folded = 'This sentence is folded\n\
 using LF and a space.';
var lenient_space_folded_expected = 'This sentence is folded using LF and a space.';

var lenient_tab_folded = 'This sentence is folded\n\
\tusing LF and a tab.';
var lenient_tab_folded_expected = 'This sentence is folded\tusing LF and a tab.';

var lenient_not_folded = 'This is not a valid fold;\n\
the LF should not be unfolded.';


var strict_multiple_space_folded = 'This sentence is folded\r\n\
    using CRLF and multiple spaces.';
var strict_multiple_space_folded_expected = 'This sentence is folded    using CRLF and multiple spaces.';

// ---------------------------------------------------------------------------------------------------------------------

var options;

var sharedTests = {
    'unfolds a line folded using CRLF and a space': function()
    {
        var result = unfold(strict_space_folded, options);

        assert.strictEqual(result, strict_space_folded_expected);
    },

    'unfolds a line folded using CRLF and a tab': function()
    {
        var result = unfold(strict_tab_folded, options);

        assert.strictEqual(result, strict_tab_folded_expected);
    },


    'does not unfold two lines delineated by LF with no leading space or tab': function()
    {
        var result = unfold(lenient_not_folded, options);

        assert.strictEqual(result, lenient_not_folded);
    },

    'does not unfold two lines delineated by CRLF with no leading space or tab': function()
    {
        var result = unfold(strict_not_folded, options);

        assert.strictEqual(result, strict_not_folded);
    },


    'preserves multiple spaces when unfolding': function()
    {
        var result = unfold(strict_multiple_space_folded, options);

        assert.strictEqual(result, strict_multiple_space_folded_expected);
    },
};

describe('unfold()', function()
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
            var result = unfold(lenient_space_folded, {strict: true});

            assert.strictEqual(result, lenient_space_folded);
        });

        it('does not unfold a line folded using LF and a tab', function()
        {
            var result = unfold(lenient_tab_folded, {strict: true});

            assert.strictEqual(result, lenient_tab_folded);
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
            var result = unfold(lenient_space_folded);

            assert.strictEqual(result, lenient_space_folded_expected);
        });

        it('unfolds a line folded using LF and a tab', function()
        {
            var result = unfold(lenient_tab_folded);

            assert.strictEqual(result, lenient_tab_folded_expected);
        });
    }); // end describe 'in lenient mode'
}); // end describe '.unfold()'
