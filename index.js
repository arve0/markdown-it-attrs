'use strict';

var utils = require('./utils.js');

module.exports = function attributes(md) {

  function curlyAttrs(state){
    var l = state.tokens.length;
    var tokens = state.tokens;
    for (var i = 0; i < l; i++) {
      if (tokens[i].type !== 'inline') {
        continue;
      }

      var inlineTokens = tokens[i].children;
      if (!inlineTokens || inlineTokens.length <= 0) {
        continue;
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
      for (var j=0, l=attrs.length; j<l; ++j) {
        var key = attrs[j][0];
        if (key === 'class' && tokens[i - 1].attrIndex(key) !== -1) {
          // append space seperated text string
          var classIdx = tokens[i - 1].attrIndex(key);
          tokens[i - 1].attrs[classIdx][1] += ' ' + attrs[j][1];
        } else {
          tokens[i - 1].attrPush(attrs[j]);
        }
      }

      inlineTokens[end].content = content.slice(0, curlyStart).trim();

    }
  }
  md.core.ruler.push('curly_attributes', curlyAttrs);
};
