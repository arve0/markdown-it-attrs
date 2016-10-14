'use strict';

var utils = require('./utils.js');

module.exports = function attributes(md) {

  function curlyAttrs(state){
    var tokens = state.tokens;
    var l = tokens.length;
    for (var i = 0; i < l; ++i) {
      // fenced code blocks
      if (tokens[i].block && tokens[i].info && hasCurly(tokens[i].info)) {
        var codeCurlyStart = tokens[i].info.indexOf('{');
        var codeCurlyEnd = tokens[i].info.length - 1;
        var codeAttrs = utils.getAttrs(tokens[i].info, codeCurlyStart + 1, codeCurlyEnd);
        utils.addAttrs(codeAttrs, tokens[i]);
        tokens[i].info = removeCurly(tokens[i].info);
        continue;
      }
      // block tokens contain markup
      // inline tokens contain the text
      if (tokens[i].type !== 'inline') {
        continue;
      }

      var inlineTokens = tokens[i].children;
      if (!inlineTokens || inlineTokens.length <= 0) {
        continue;
      }

      // attributes in inline tokens:
      // inline **bold**{.red} text
      // {
      //   "type": "strong_close",
      //   "tag": "strong",
      //   "attrs": null,
      //   "map": null,
      //   "nesting": -1,
      //   "level": 0,
      //   "children": null,
      //   "content": "",
      //   "markup": "**",
      //   "info": "",
      //   "meta": null,
      //   "block": false,
      //   "hidden": false
      // },
      // {
      //   "type": "text",
      //   "tag": "",
      //   "attrs": null,
      //   "map": null,
      //   "nesting": 0,
      //   "level": 0,
      //   "children": null,
      //   "content": "{.red} text",
      //   "markup": "",
      //   "info": "",
      //   "meta": null,
      //   "block": false,
      //   "hidden": false
      // }
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
        var inlineAttrs = utils.getAttrs(inlineTokens[j].content, 1, endChar);
        if (inlineAttrs.length !== 0) {
          // remove {}
          inlineTokens[j].content = inlineTokens[j].content.slice(endChar + 1);
          // add attributes
          attrToken.info = 'b';
          utils.addAttrs(inlineAttrs, attrToken);
        }
      }

      // attributes for blocks
      var lastInlineToken;
      if (hasCurly(tokens[i].content)) {
        lastInlineToken = last(inlineTokens);
        var content = lastInlineToken.content;
        var curlyStart = content.lastIndexOf('{');
        var attrs = utils.getAttrs(content, curlyStart + 1, content.length - 1);
        // if list and `\n{#c}` -> apply to bullet list open:
        //
        // - iii
        // {#c}
        //
        // should give
        //
        // <ul id="c">
        //   <li>iii</li>
        // </ul>
        var nextLastInline = nextLast(inlineTokens);
        // some blocks are hidden, example li > paragraph_open
        var correspondingBlock = firstTokenNotHidden(tokens, i - 1);
        if (nextLastInline && nextLastInline.type === 'softbreak' &&
            correspondingBlock && correspondingBlock.type === 'list_item_open') {
          utils.addAttrs(attrs, bulletListOpen(tokens, i - 1));
          // remove softbreak and {} inline tokens
          tokens[i].children = inlineTokens.slice(0, -2);
          tokens[i].content = removeCurly(tokens[i].content);
          if (hasCurly(tokens[i].content)) {
            // do once more:
            //
            // - item {.a}
            // {.b} <-- applied this
            i -= 1;
          }
        } else {
          utils.addAttrs(attrs, correspondingBlock);
          lastInlineToken.content = removeCurly(content);
          if (lastInlineToken.content === '') {
            // remove empty inline token
            inlineTokens.pop();
          }
          tokens[i].content = removeCurly(tokens[i].content);
        }
      }

    }
  }
  md.core.ruler.before('replacements', 'curly_attributes', curlyAttrs);
};

/**
 * test if string has proper formated curly
 */
function hasCurly(str) {
  // we need minimum four chars, example {.b}
  if (!str || !str.length || str.length < 4) {
    return false;
  }

  // should end in }
  if (str.charAt(str.length - 1) !== '}') {
    return false;
  }

  // should start with {
  if (str.indexOf('{') === -1) {
    return false;
  }
  return true;
}

/**
 * some blocks are hidden (not rendered)
 */
function firstTokenNotHidden(tokens, i) {
  if (tokens[i] && tokens[i].hidden) {
    return firstTokenNotHidden(tokens, i - 1);
  }
  return tokens[i];
}

/**
 * Find corresponding bullet/ordered list open.
 */
function bulletListOpen(tokens, i) {
  var level = 0;
  var token;
  for (; i >= 0; i -= 1) {
    token = tokens[i];
    // jump past nested lists, level == 0 and open -> correct opening token
    if (token.type === 'bullet_list_close' ||
        token.type === 'ordered_list_close') {
      level += 1;
    }
    if (token.type === 'bullet_list_open' ||
        token.type === 'ordered_list_open') {
      if (level === 0) {
        return token;
      } else {
        level -= 1;
      }
    }
  }
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
/**
 * Removes last curly from string.
 */
function removeCurly(str) {
  var curly = /[ \n]?{[^{}}]+}$/;
  var pos = str.search(curly);

  return pos !== -1 ? str.slice(0, pos) : str;
}

function last(arr) {
  return arr.slice(-1)[0];
}

function nextLast(arr) {
  return arr.slice(-2, -1)[0];
}
