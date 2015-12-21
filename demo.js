'use strict';
var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attrs');
var fs = require('fs');

md.use(markdownItAttrs);

var src = fs.readFileSync('demo.md', 'utf8');
var res = md.render(src);

console.log(res);
