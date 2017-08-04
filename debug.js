/* eslint-env es6 */
var md = require('markdown-it')();
var markdownItAttrs = require('./');

md.use(markdownItAttrs).use(require('../markdown-it-implicit-figures'));

var src = '> quote\n{.c}';

var res = md.render(src);

console.log(res);  // eslint-disable-line
