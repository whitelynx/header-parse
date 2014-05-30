header-parse
============

Parse RFC822-compliant (and similar) headers.

This will parse header blocks that conform to [RFC822 section 3][] or [RFC2616 section 4.2][], as well as a few
variations of those standards. One major deviation is that this library _by default_ treats `\r\n` and `\n` as the
same, so headers separated by either will be parsed.

This should be useful to parse:

- HTTP headers
- MIME headers (from standard emails, or multipart messages)
- [Maruku-style Markdown document metadata][]

[RFC822 section 3]: https://tools.ietf.org/html/rfc822#section-3
[RFC2616 section 4.2]: https://tools.ietf.org/html/rfc2616#section-4.2
[Maruku-style Markdown document metadata]: http://maruku.rubyforge.org/maruku.html#meta
