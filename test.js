var fs = require('fs');
var util = require('util');

var headerParse = require('./header-parse');


var output = headerParse.extractHeaderBlock(fs.readFileSync('test.md'));
console.log(util.inspect(output, {colors: true}));
//console.dir(output);
