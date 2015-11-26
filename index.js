'use strict';

var utils = require('./utils.js');

module.exports = function attributes(md) {

  function curlyAttrs(state){
    var tokens = state.tokens;
    var l = tokens.length;
    for (var i = 0; i < l; ++i) {
      // block tokens contain markup
      // inline tokens contain the text
      if (tokens[i].type !== 'inline') {
        continue;
      }

      var inlineTokens = tokens[i].children;
      if (!inlineTokens || inlineTokens.length <= 0) {
        continue;
      }

      // attributes in inline tokens
      for (var j=0, k=inlineTokens.length; j<k; ++j) {
        // should be inline token of type text
        if (!inlineTokens[j] || inlineTokens[j].type !== 'text') {
          continue;
        }
        // token before should not be opening
        if (!inlineTokens[j - 1] || inlineTokens[j - 1].nesting === 1) {
          continue;
        }
        // token should contain { in begining
        if (inlineTokens[j].content[0] !== '{') {
          continue;
        }
        // } should be found
        var endChar = inlineTokens[j].content.indexOf('}');
        if (endChar === -1) {
          continue;
        }
        // which token to add attributes to
        var attrToken = matchingOpeningToken(inlineTokens, j - 1);
        if (!attrToken) {
          continue;
        }
        var attrs = utils.getAttrs(inlineTokens[j].content, 1, endChar);
        if (attrs.length !== 0) {
          // remove {}
          inlineTokens[j].content = inlineTokens[j].content.substr(endChar + 1);
          // add attributes
          attrToken.info = "b";
          utils.addAttrs(attrs, attrToken);
        }
      }

      // attributes for blocks
      if (hasCurlyEnd(tokens[i])) {
        var content = last(inlineTokens).content;
        var curlyStart = content.lastIndexOf('{');
        var attrs = utils.getAttrs(content, curlyStart + 1, content.length - 1);
        // some blocks are hidden, example li > paragraph_open
        utils.addAttrs(attrs, firstTokenNotHidden(tokens, i - 1));
        if (content[curlyStart - 1] === ' ') {
          // trim space before {}
          curlyStart -= 1;
        }
        last(inlineTokens).content = content.slice(0, curlyStart);
      }

    }
  }
  md.core.ruler.push('curly_attributes', curlyAttrs);
  // render inline code blocks with attrs
  md.renderer.rules.code_inline = renderCodeInline;
};

function renderCodeInline(tokens, idx, _, __, slf) {
  var token = tokens[idx];
  return '<code'+ slf.renderAttrs(token) +'>'
       + utils.escapeHtml(tokens[idx].content)
       + '</code>';
}
/**
 * test if inline token has proper formated curly end
 */
function hasCurlyEnd(token) {
  // we need minimum four chars, example {.b}
  if (!token.content || token.content.length < 4) {
    return false;
  }

  // should end in }
  var content = token.content;
  if (content.charAt(content.length - 1) !== '}') {
    return false;
  }

  // should start with {
  var curlyStart = content.indexOf('{');
  if (curlyStart === -1) {
    return false;
  }
  return true;
}

/**
 * some blocks are hidden (not rendered)
 */
function firstTokenNotHidden(tokens, i) {
  if (tokens[i].hidden) {
    return firstTokenNotHidden(tokens, i - 1);
  }
  return tokens[i];
}

/**
 * find corresponding opening block
 */
function matchingOpeningToken(tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  }
  // non closing blocks, example img
  if (tokens[i].nesting === 0) {
    return tokens[i];
  }
  var type = tokens[i].type.replace('_close', '_open');
  for (; i >= 0; --i) {
    if (tokens[i].type === type) {
      return tokens[i];
    }
  }
}

function last(arr) {
  return arr.slice(-1)[0];
}
