'use strict';
var md = require('markdown-it')();
var markdownItAttrs = require('./');

md.use(markdownItAttrs);

var src = '# header {.green}\nsome text {with=attrs}';
var res = md.render(src);

console.log(res);
