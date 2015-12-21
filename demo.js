'use strict';
var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attrs');

md.use(markdownItAttrs);

var src = '# header {.style-me}\n'
src += 'paragraph {data-toggle=modal}';

var res = md.render(src);

console.log(res);
