/* eslint-env es6 */
const md = require('markdown-it')();
const markdownItAttrs = require('./');

md.use(markdownItAttrs).use(require('../markdown-it-implicit-figures'));

let src = '> quote\n{.c}';

let res = md.render(src);

console.log(res);  // eslint-disable-line
