(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownItAttrs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
 * Find first bullet list open.
 */
function bulletListOpen(tokens, i) {
  if (tokens[i] &&
      tokens[i].type !== 'bullet_list_open' &&
      tokens[i].type !== 'ordered_list_open') {
    return bulletListOpen(tokens, i - 1);
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

},{"./utils.js":2}],2:[function(require,module,exports){
'use strict';
/**
 * parse {.class #id key=val} strings
 * @param {string} str: string to parse
 * @param {int} start: where to start parsing (not including {)
 * @param {int} end: where to stop parsing (not including })
 * @returns {2d array}: [['key', 'val'], ['class', 'red']]
 */
exports.getAttrs = function(str, start, end) {
  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  var allowedKeyChars = /[^\t\n\f \/>"'=]/;
  var pairSeparator = ' ';
  var keySeparator = '=';
  var classChar = '.';
  var idChar = '#';

  var attrs = [];
  var key = '';
  var value = '';
  var parsingKey = true;
  var valueInsideQuotes = false;

  // read inside {}
  for (var i=start; i <= end; ++i) {
    var char_ = str.charAt(i);

    // switch to reading value if equal sign
    if (char_ === keySeparator) {
      parsingKey = false;
      continue;
    }

    // {.class}
    if (char_ === classChar && key === '') {
      key = 'class';
      parsingKey = false;
      continue;
    }

    // {#id}
    if (char_ === idChar && key === '') {
      key = 'id';
      parsingKey = false;
      continue;
    }

    // {value="inside quotes"}
    if (char_ === '"' && value === '') {
      valueInsideQuotes = true;
      continue;
    }
    if (char_ === '"' && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    }

    // read next key/value pair
    if ((char_ === pairSeparator && !valueInsideQuotes) || i === end) {
      if (key === '') {
        // beginning or ending space: { .red } vs {.red}
        continue;
      }
      attrs.push([key, value]);
      key = '';
      value = '';
      parsingKey = true;
      continue;
    }

    // continue if character not allowed
    if (parsingKey && char_.search(allowedKeyChars) === -1) {
      continue;
    }

    // no other conditions met; append to key/value
    if (parsingKey) {
      key += char_;
      continue;
    }
    value += char_;
  }
  return attrs;
};

/**
 * add attributes from [['key', 'val']] list
 * @param {array} attrs: [['key', 'val']]
 * @param {token} token: which token to add attributes
 * @returns token
 */
exports.addAttrs = function(attrs, token) {
  for (var j=0, l=attrs.length; j<l; ++j) {
    var key = attrs[j][0];
    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else {
      token.attrPush(attrs[j]);
    }
  }
  return token;
};

/**
 * from https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js
 */
var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

exports.escapeHtml = function(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
};

},{}]},{},[1])(1)
});