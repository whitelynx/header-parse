//---------------------------------------------------------------------------------------------------------------------
// Parse (mostly) RFC822-compliant headers.
//
// This will parse header blocks that conform to [RFC822 section 3][] or [RFC2616 section 4.2][], as well as a few
// variations of those standards. One major deviation is that this library _by default_ treats `\r\n` and `\n` as the
// same, so headers separated by either will be parsed.
//
// [RFC822 section 3]: https://tools.ietf.org/html/rfc822#section-3
// [RFC2616 section 4.2]: https://tools.ietf.org/html/rfc2616#section-4.2
//
// @module header-parse
//---------------------------------------------------------------------------------------------------------------------

var util = require('util');

//---------------------------------------------------------------------------------------------------------------------

/**
 * A parsed document.
 *
 * @typedef {object} HeaderParseDocument
 *
 * @property {?string} headerBlock - the raw, unparsed header block of the document, if one was present
 * @property {?Object.<string, string>} headers - the parsed headers, if headers were present and parsing was performed
 * @property {string} body - the body of the document
 */

//---------------------------------------------------------------------------------------------------------------------

/**
 * General options for header-parse functions.
 *
 * @typedef {object} GeneralOptions
 *
 * @property {?boolean} strict - `true` for **strict** mode (strict RFC822 compliance); default is **lenient** mode
 */

/**
 * Options for `parseHeaders()`
 *
 * @typedef {object} ParseHeadersOptions
 * @extends GeneralOptions
 *
 * @property {?boolean} collapse - `false` to preserve internal linear whitespace other than newlines in field bodies
 * @property {?boolean} trim - `false` to preserve leading and trailing linear whitespace in field bodies (ignored if
 *          `collapse` is not `false`)
 * @property {?boolean} unfold - `false` to preserve newlines in field bodies (ignored if `collapse` is not `false`)
 */

/**
 * Options for `extractHeaderBlock()`
 *
 * @typedef {object} ExtractHeaderBlockOptions
 * @extends ParseHeadersOptions
 *
 * @property {?boolean} parse - `false` to inhibit parsing of headers (just separate the raw header block and the body)
 */

//---------------------------------------------------------------------------------------------------------------------

var templateRE = /\{(\w+)\}/g;
function genRegexes(parts)
{
    if(!parts.nonLWSPChar)
    {
        var lwspChar = parts.lwspChar;
        parts.nonLWSPChar = (lwspChar.slice(0, 2) == '[^') ? ('[' + lwspChar.slice(2)) : ('[^' + lwspChar.slice(1));
    } // end if

    return {
        headerBlock: fmtRE('^((?:{fieldName}:(?:.*{newline}{lwspChar})*.*{newline})*){newline}', ''),
        header: fmtRE('^({fieldName}):((?:.*{newline}{lwspChar})*.*)$', 'gm'),
        fold: fmtRE('{newline}({lwspChar})', 'g'),
        trim: fmtRE('^{lwspChar}*((?:{nonLWSPChar}[^]*)?{nonLWSPChar})?{lwspChar}*$', ''),
        linearWhiteSpace: fmtRE('(?:{newline})?{lwspChar}+', 'g'),
    };

    function fmtRE(reSrc, flags)
    {
        reSrc = reSrc.replace(templateRE, function(m, varname)
        {
            return parts[varname];
        });

        return new RegExp(reSrc, flags);
    } // end fmtRE
} // end genRegexes

/**
 * Regular expressions to parse and transform header blocks.
 *
 * Note: The following regex snippets, used in the **strict** regexes below, match rules from from RFC822 sections
 * [3.2][RFC822 section 3.2] and [3.3][RFC822 section 3.3]:
 *
 * - "field-name": `/[!-9;-~]+/` (`1*<any CHAR, excluding CTLs, SPACE, and ":">`)
 * - "LWSP-char": `/[ \t]/` (`SPACE / HTAB`)
 *
 * The **lenient** regexes use different snippets for these rules, allowing for more lenient parsing:
 *
 * - "field-name": `/\S+/` (any non-whitespace character)
 * - "LWSP-char": `/[^\S\r\n]/` ([any whitespace character other than `\r` or `\n`][JS-RE-WS-NN])
 *
 * [JS-RE-WS-NN]: http://stackoverflow.com/a/3469155/677694 "regex - How do I match whitespace but not newlines?"
 * [RFC822 section 3.2]: https://tools.ietf.org/html/rfc822#section-3.2 "HEADER FIELD DEFINITIONS"
 * [RFC822 section 3.3]: https://tools.ietf.org/html/rfc822#section-3.3 "LEXICAL TOKENS"
 */
var regexes = {
    strict: genRegexes({newline: '\\r\\n', fieldName: '[!-9;-~]+', lwspChar: '[ \\t]'}),
    lenient: genRegexes({newline: '\\r?\\n', fieldName: '\\S+', lwspChar: '[^\\S\\r\\n]', nonLWSPChar: '\\S'}),
};

regexes.strict.invalidHeaderBlock = /(?:^|[^\r])\n/;

//---------------------------------------------------------------------------------------------------------------------

/**
 * If the given data contains a header block, separate the headers and body.
 *
 * From [RFC822 section 3.1][]:
 * > A message consists of header fields and, optionally, a body.
 * > The body is simply a sequence of lines containing ASCII characters.
 * > It is separated from the headers by a null line (i.e., a line with nothing preceding the CRLF).
 *
 * In **strict** mode, this will only split the header block from the body on a `\r\n\r\n` sequence, or a `\r\n`
 * sequence at the beginning of the data.
 * In **lenient** mode, this will split the header block from the body on any two consecutive newline sequences (either
 * `\r\n` or just `\n`), or a newline sequence at the beginning of the data.
 *
 * If `parse` is not disabled, `parseHeaders()` will be called with the same mode with which `extractHeaderBlock()` was
 * called.
 *
 * [RFC822 section 3.1]: https://tools.ietf.org/html/rfc822#section-3.1 "GENERAL DESCRIPTION"
 *
 * @param {(string|Buffer)} data
 * @param {ExtractHeaderBlockOptions} options - options to control the extraction/parsing process
 *
 * @returns {HeaderParseDocument}
 */
function extractHeaderBlock(data, options)
{
    options = options || {};
    var re = options.strict ? regexes.strict : regexes.lenient;

    var parse = options.parse === undefined || options.parse; // default to true

    data = data.toString();

    var match = re.headerBlock.exec(data);
    if(match)
    {
        var doc = {
            headerBlock: match[1],
            body: data.slice(match[0].length),
        };

        if(parse)
        {
            doc.headers = parseHeaders(doc.headerBlock, options);
        } // end if

        return doc;
    } // end if

    return {body: data};
} // end extractHeaderBlock

/**
 * Parse all headers out of the given header block data.
 *
 * From [RFC822 section 3.1.2][]:
 * > Once a field has been unfolded, it may be viewed as being composed of a field-name followed by a colon (":"),
 * > followed by a field-body, and terminated by a carriage-return/line-feed.
 * > The field-name must be composed of printable ASCII characters (i.e., characters that have values between 33. and
 * > 126., decimal, except colon).
 * > The field-body may be composed of any ASCII characters, except CR or LF. (While CR and/or LF may be present in the
 * > actual text, they are removed by the action of unfolding the field.)
 *
 * In **strict** mode, headers are separated by "CRLF" sequences (`\r\n`, as defined by [RFC822 section 3.3][]).
 * In **lenient** mode, headers are separated by newline sequences (either `\r\n` or just `\n`).
 * Depending on the passed options, this function may call `collapse()`, `trim()`, and/or `unfold()`; see those
 * functions for more effects of the chosen mode.
 *
 * [RFC822 section 3.1.2]: https://tools.ietf.org/html/rfc822#section-3.1.2 "STRUCTURE OF HEADER FIELDS"
 * [RFC822 section 3.3]: https://tools.ietf.org/html/rfc822#section-3.3 "LEXICAL TOKENS"
 *
 * @param {(string|Buffer)} data - the raw header block
 * @param {ParseHeadersOptions} options - options to control the parsing process
 *
 * @returns {Object.<string, string>} parsed headers
 */
function parseHeaders(data, options)
{
    options = options || {};
    var re = options.strict ? regexes.strict : regexes.lenient;

    var doCollapse = options.collapse === undefined || options.collapse; // default to true
    var doTrim = options.trim === undefined || options.trim; // default to true
    var doUnfold = options.unfold === undefined || options.unfold; // default to true

    var match;
    if(re.invalidHeaderBlock)
    {
        match = re.invalidHeaderBlock.exec(data);
        if(match)
        {
            throw new Error(util.format("Invalid header block data! (matched %j)", match[0]));
        } // end if
    } // end if

    var headers = {};

    match = re.header.exec(data);
    while(match)
    {
        var value = match[2];

        if(doCollapse)
        {
            value = collapse(value, options);
        }
        else
        {
            if(doTrim)
            {
                value = trim(value, options);
            } // end if

            if(doUnfold)
            {
                value = unfold(value, options);
            } // end if
        } // end if

        headers[match[1]] = value;

        match = re.header.exec(data);
    } // end while

    return headers;
} // end parseHeaders

/**
 * Collapse all linear whitespace in the given data.
 *
 * Leading and trailing linear whitespace is also removed. (see `trim()`)
 *
 * From [RFC2616 section 4.2][]:
 * > The field-content does not include any leading or trailing LWS: linear white space occurring before the first
 * > non-whitespace character of the field-value or after the last non-whitespace character of the field-value.
 * > Such leading or trailing LWS MAY be removed without changing the semantics of the field value.
 * > Any LWS that occurs between field-content MAY be replaced with a single SP before interpreting the field value or
 * > forwarding the message downstream.
 *
 * This also reverses folding, as defined in [RFC822 section 3.1.1][]:
 * > Each header field can be viewed as a single, logical line of ASCII characters, comprising a field-name and a
 * > field-body.
 * > For convenience, the field-body portion of this conceptual entity can be split into a multiple-line
 * > representation; this is called "folding".
 * > The general rule is that wherever there may be linear-white-space (NOT simply LWSP-chars), a CRLF immediately
 * > followed by AT LEAST one LWSP-char may instead be inserted.
 *
 * From [RFC822 section 3.1.2][]:
 * > The field-body may be composed of any ASCII characters, except CR or LF. (While CR and/or LF may be present in the
 * > actual text, they are removed by the action of unfolding the field.)
 *
 * If using **strict** mode, all "linear-white-space" (as defined by [RFC822 section 3.3][]) is collapsed.
 * If using **lenient** mode, all non-newline whitespace characters (i.e., [the `[^\S\r\n]` character set in
 * JavaScript][JS-RE-WS-NN]) are collapsed, along with any preceding newline sequences.
 *
 * [JS-RE-WS-NN]: http://stackoverflow.com/a/3469155/677694 "regex - How do I match whitespace but not newlines?"
 * [RFC822 section 3.1.1]: https://tools.ietf.org/html/rfc822#section-3.1.1 "LONG HEADER FIELDS"
 * [RFC822 section 3.1.2]: https://tools.ietf.org/html/rfc822#section-3.1.2 "STRUCTURE OF HEADER FIELDS"
 * [RFC822 section 3.3]: https://tools.ietf.org/html/rfc822#section-3.3 "LEXICAL TOKENS"
 * [RFC2616 section 4.2]: https://tools.ietf.org/html/rfc2616#section-4.2 "Message Headers"
 *
 * @param {(string|Buffer)} data
 * @param {GeneralOptions} options
 *
 * @returns {string} collapsed data
 */
function collapse(data, options)
{
    options = options || {};
    var re = options.strict ? regexes.strict : regexes.lenient;

    data = trim(data, options);

    return data.replace(re.linearWhiteSpace, ' '); // Replace any run of linear whitespace with a single space.
} // end collapse

/**
 * Trim all leading or trailing linear whitespace from the given data.
 *
 * From [RFC2616 section 4.2][]:
 * > The field-content does not include any leading or trailing LWS: linear white space occurring before the first
 * > non-whitespace character of the field-value or after the last non-whitespace character of the field-value.
 * > Such leading or trailing LWS MAY be removed without changing the semantics of the field value.
 * > Any LWS that occurs between field-content MAY be replaced with a single SP before interpreting the field value or
 * > forwarding the message downstream.
 *
 * If using **strict** mode, any "linear-white-space" (as defined by [RFC822 section 3.3][]) at the beginning or end of
 * the given data is removed.
 * If using **lenient** mode, any non-newline whitespace characters (i.e., [the `[^\S\r\n]` character set in
 * JavaScript][JS-RE-WS-NN]) at the beginning or end of the given data are removed.
 *
 * [JS-RE-WS-NN]: http://stackoverflow.com/a/3469155/677694 "regex - How do I match whitespace but not newlines?"
 * [RFC822 section 3.3]: https://tools.ietf.org/html/rfc822#section-3.3 "LEXICAL TOKENS"
 * [RFC2616 section 4.2]: https://tools.ietf.org/html/rfc2616#section-4.2 "Message Headers"
 *
 * @param {(string|Buffer)} data
 * @param {GeneralOptions} options
 *
 * @returns {string} collapsed data
 */
function trim(data, options)
{
    options = options || {};
    var re = options.strict ? regexes.strict : regexes.lenient;

    data = data.toString();

    return data.replace(re.trim, '$1'); // Replace any run of linear whitespace with a single space.
} // end trim

/**
 * Unfold all folded lines in the given data, leaving other whitespace intact.
 *
 * From [RFC822 section 3.1.1][]:
 * > Each header field can be viewed as a single, logical line of ASCII characters, comprising a field-name and a
 * > field-body.
 * > For convenience, the field-body portion of this conceptual entity can be split into a multiple-line
 * > representation; this is called "folding".
 * > The general rule is that wherever there may be linear-white-space (NOT simply LWSP-chars), a CRLF immediately
 * > followed by AT LEAST one LWSP-char may instead be inserted.
 *
 * Instead of collapsing newlines followed by linear whitespace into a single space (as `collapse()` does), this
 * function simply removes those newlines, leaving any surrounding whitespace as-is. Since this does not follow the
 * RFC, using `unfold()` technically breaks strict RFC822 compliance.
 *
 * If using **strict** mode, all "CRLF" sequences (`\r\n`, as defined by [RFC822 section 3.3][]) that are directly
 * followed by "LWSP-char" (` ` or `\t`, as defined by [RFC822 section 3.3][]) are removed.
 * If using **lenient** mode, all `\r\n` sequences or `\n` characters that are directly followed by a non-newline
 * whitespace character (i.e., [the `[^\S\r\n]` character set in JavaScript][JS-RE-WS-NN]) are removed.
 *
 * [JS-RE-WS-NN]: http://stackoverflow.com/a/3469155/677694 "regex - How do I match whitespace but not newlines?"
 * [RFC822 section 3.1.1]: https://tools.ietf.org/html/rfc822#section-3.1.1 "LONG HEADER FIELDS"
 * [RFC822 section 3.3]: https://tools.ietf.org/html/rfc822#section-3.3 "LEXICAL TOKENS"
 *
 * @param {(string|Buffer)} data
 * @param {GeneralOptions} options
 *
 * @returns {string} unfolded data
 */
function unfold(data, options)
{
    options = options || {};
    var re = options.strict ? regexes.strict : regexes.lenient;

    data = data.toString();

    return data.replace(re.fold, '$1');
} // end unfold

//---------------------------------------------------------------------------------------------------------------------

module.exports = {
    regexes: regexes,
    extractHeaderBlock: extractHeaderBlock,
    parseHeaders: parseHeaders,
    collapse: collapse,
    trim: trim,
    unfold: unfold,
};
