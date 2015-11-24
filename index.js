'use strict';

var utils = require('./utils.js');

module.exports = function attributes(md) {

  function curlyAttrs(state){
    var tokens = state.tokens;
    var l = tokens.length;
    for (var i = 0; i < l; ++i) {
      if (tokens[i].type !== 'inline') {
        continue;
      }

      var inlineTokens = tokens[i].children;
      if (!inlineTokens || inlineTokens.length <= 0) {
        continue;
      }

      // find {} in inline tokens
      for (var j=0, k=inlineTokens.length; j<k; ++j) {
        if (inlineTokens[j].type === 'text' || inlineTokens[j].type === 'softbreak') {
          continue;
        }
        // next token should be text and contain { in begining
        if (!inlineTokens[j + 1]) {
          continue;
        }
        if (inlineTokens[j + 1].type !== 'text') {
          continue;
        }
        if (inlineTokens[j + 1].content[0] !== '{') {
          continue;
        }
        // } should be found
        var endChar = inlineTokens[j + 1].content.indexOf('}');
        if (endChar === -1) {
          continue;
        }
        var attrs = utils.getAttrs(inlineTokens[j + 1].content, 1, endChar);
        // remove {.bla bla}
        if (attrs.length !== 0) {
          // remove {}
          inlineTokens[j + 1].content = inlineTokens[j + 1].content.substr(endChar + 1);
          // add attributes
          utils.addAttrs(attrs, inlineTokens[j - 2]);
        }

      }

      var end = inlineTokens.length - 1;
      var content = inlineTokens[end].content;

      // should end in }
      if (content.charAt(content.length - 1) !== '}') {
        continue;
      }

      var curlyStart = content.indexOf('{');

      // should start with {
      if (curlyStart === -1) {
        continue;
      }

      // read inside {}
      var attrs = utils.getAttrs(content, curlyStart + 1, content.length - 1);
      utils.addAttrs(attrs, tokens[i - 1]);

      inlineTokens[end].content = content.slice(0, curlyStart).trim();

    }
  }
  md.core.ruler.push('curly_attributes', curlyAttrs);
};
