'use strict';
var md = require('markdown-it')();
var markdownItAttrs = require('./');

md.use(markdownItAttrs);

var src = '# header {a=lorem .green #id}\nsome text {with=attrs}';
var res = md.render(src);

console.log(res);
