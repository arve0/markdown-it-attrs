/* eslint-env es6 */
var md = require('markdown-it')();
var markdownItAttrs = require('./');

md.use(markdownItAttrs);

var src = `- i1
  - n1
  {.first}
{.second}`;

var res = md.render(src);

console.log(res);  // eslint-disable-line
