'use strict';
var md = require('markdown-it')();
var markdownItAttrs = require('./');

md.use(markdownItAttrs);

var src = '# header {.green #id}\nsome text {with=attrs and="attrs with space"}';
var res = md.render(src);

console.log(res);
