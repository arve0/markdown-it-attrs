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
