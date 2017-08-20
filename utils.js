'use strict';
/**
 * parse {.class #id key=val} strings
 * @param {string} str: string to parse
 * @param {int} start: where to start parsing (including {)
 * @returns {2d array}: [['key', 'val'], ['class', 'red']]
 */
exports.getAttrs = function (str, start, end) {
  // TODO: do not require `end`, stop when } is found
  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  const allowedKeyChars = /[^\t\n\f />"'=]/;
  const pairSeparator = ' ';
  const keySeparator = '=';
  const classChar = '.';
  const idChar = '#';
  const endChar = '}';

  const attrs = [];
  let key = '';
  let value = '';
  let parsingKey = true;
  let valueInsideQuotes = false;

  // read inside {}
  // start + 1 to avoid beginning {
  // breaks when } is found or end of string
  for (let i = start + 1; i < str.length; i++) {
    let char_ = str.charAt(i);
    if (char_ === endChar) {
      if (key !== '') { attrs.push([key, value]); }
      break;
    }

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
exports.addAttrs = function (attrs, token) {
  for (let j = 0, l = attrs.length; j < l; ++j) {
    let key = attrs[j][0];
    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else {
      token.attrPush(attrs[j]);
    }
  }
  return token;
};

/**
 * Does string have properly formatted curly?
 *
 * start: '{.a} asdf'
 * middle: 'a{.b}c'
 * end: 'asdf {.a}'
 * only: '{.a}'
 *
 * @param {string} where to expect {} curly. start, middle, end or only.
 * @return {function(string)} Function which testes if string has curly.
 */
exports.hasCurly = function (where) {

  if (!where) {
    throw new Error('Parameter `where` not passed. Should be "start", "middle", "end" or "only".');
  }

  /**
   * @param {string} str
   * @return {boolean}
   */
  return function (str) {
    // we need minimum four chars, example {.b}
    if (!str || typeof str !== 'string' || str.length < 4) {
      return false;
    }

    let start, end;
    switch (where) {
    case 'start':
      // first char should be {, } found in char 3 or more
      return str.charAt(0) === '{' &&
          str.indexOf('}', 3) !== -1;

    case 'middle':
      // 'a{.b}'
      start = str.indexOf('{', 1);
      end = start !== -1 && str.indexOf('}', start + 3);
      return start !== -1 && end !== -1;

    case 'end':
      // last char should be }
      end = str.charAt(str.length - 1) === '}';
      start = end && str.indexOf('{');
      return end && (start + 3) < str.length;

    case 'only':
      // '{.a}'
      return str.charAt(0) === '{' &&
          // make sure first occurence is last occurence
          str.indexOf('}', 3) === (str.length - 1);
    }
  };
};

/**
 * Removes last curly from string.
 */
exports.removeCurly = function (str) {
  let curly = /[ \n]?{[^{}}]+}$/;
  let pos = str.search(curly);

  return pos !== -1 ? str.slice(0, pos) : str;
};

/**
 * find corresponding opening block
 */
exports.getMatchingOpeningToken = function (tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  }
  // non closing blocks, example img
  if (tokens[i].nesting === 0) {
    return tokens[i];
  }

  // inline tokens changes level on same token
  // that have .nesting +- 1
  let level = tokens[i].block
    ? tokens[i].level
    : tokens[i].level + 1;  // adjust for inline tokens

  let type = tokens[i].type.replace('_close', '_open');

  for (; i >= 0; --i) {
    if (tokens[i].type === type && tokens[i].level === level) {
      return tokens[i];
    }
  }
};


/**
 * from https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js
 */
let HTML_ESCAPE_TEST_RE = /[&<>"]/;
let HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
let HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

exports.escapeHtml = function (str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
};
