/* eslint-env es6 */
const md = require('markdown-it')();
const markdownItAttrs = require('./');

md.use(markdownItAttrs, {
  leftDelimiter: '{{',
  rightDelimiter: '}}'
}).use(require('../markdown-it-implicit-figures'));

let src = 'asdf *asd*{{.c}} khg';

let res = md.render(src);

console.log(res);  // eslint-disable-line
