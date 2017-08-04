/* eslint-env es6 */
var md = require('markdown-it')();
var markdownItAttrs = require('./');

md.use(markdownItAttrs).use(require('../markdown-it-implicit-figures'));

var src = `[![Image](fig.png)](page.html){target="_blank"}`;  // eslint-disable-line

var res = md.render(src);

console.log(res);  // eslint-disable-line
