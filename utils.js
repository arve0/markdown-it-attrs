/**
 * @typedef {import('.').Token} Token
 * @typedef {import('.').Options} Options
 * @typedef {import('.').AttributePair} AttributePair
 * @typedef {import('.').AllowedAttribute} AllowedAttribute
 * @typedef {import('.').DetectingStrRule} DetectingStrRule
 */
/**
 * parse {.class #id key=val} strings
 * @param {string} str: string to parse
 * @param {number} start: where to start parsing (including {)
 * @param {Options} options
 * @returns {AttributePair[]}: [['key', 'val'], ['class', 'red']]
 */
exports.getAttrs = function (str, start, options) {
  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  const allowedKeyChars = /[^\t\n\f />"'=]/;
  const pairSeparator = ' ';
  const keySeparator = '=';
  const classChar = '.';
  const idChar = '#';

  const attrs = [];
  let key = '';
  let value = '';
  let parsingKey = true;
  let valueInsideQuotes = false;

  // read inside {}
  // start + left delimiter length to avoid beginning {
  // breaks when } is found or end of string
  for (let i = start + options.leftDelimiter.length; i < str.length; i++) {
    if (!valueInsideQuotes && str.slice(i, i + options.rightDelimiter.length) === options.rightDelimiter) {
      if (key !== '') { attrs.push([key, value]); }
      break;
    }
    const char_ = str.charAt(i);

    // switch to reading value if equal sign
    if (char_ === keySeparator && parsingKey) {
      parsingKey = false;
      continue;
    }

    // {.class} {..css-module}
    if (char_ === classChar && key === '') {
      if (str.charAt(i + 1) === classChar) {
        key = 'css-module';
        i += 1;
      } else {
        key = 'class';
      }
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
    if (isUnescapedDoubleQuote(str, i) && value === '' && !valueInsideQuotes) {
      valueInsideQuotes = true;
      continue;
    }
    if (isUnescapedDoubleQuote(str, i) && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    }

    // read next key/value pair
    if ((char_ === pairSeparator && !valueInsideQuotes)) {
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

  const needsFilterAttributes = options.allowedAttributes && options.allowedAttributes.length;
  const needsFilterAttributeValues = options.allowedAttributeValues && options.allowedAttributeValues.length;

  if (needsFilterAttributes || needsFilterAttributeValues) {
    const allowedAttributes = options.allowedAttributes;
    const allowedAttributeValues = options.allowedAttributeValues;
    return attrs.filter(function (attrPair) {
      const attr = attrPair[0];
      const attrValue = attrPair[1];
      let attrPassed = !needsFilterAttributes;
      let attrValuePassed = !needsFilterAttributeValues;
      /**
       * @param {AllowedAttribute} allowedAttributeValue
       */
      function isAllowedAttributeValue (allowedAttributeValue) {
        return (attrValue === allowedAttributeValue
          || (allowedAttributeValue instanceof RegExp && allowedAttributeValue.test(attrValue))
        );
      }
      /**
       * @param {AllowedAttribute} allowedAttribute
       */
      function isAllowedAttribute (allowedAttribute) {
        return (attr === allowedAttribute
          || (allowedAttribute instanceof RegExp && allowedAttribute.test(attr))
        );
      }
      if (needsFilterAttributes) {
        attrPassed = allowedAttributes.some(isAllowedAttribute);
      }
      if (needsFilterAttributeValues) {
        attrValuePassed = allowedAttributeValues.some(isAllowedAttributeValue);
      }
      return attrPassed && attrValuePassed;
    });
  }
  return attrs;
};

/**
 * add attributes from [['key', 'val']] list
 * @param {AttributePair[]} attrs: [['key', 'val']]
 * @param {Token} token: which token to add attributes
 * @returns token
 */
exports.addAttrs = function (attrs, token) {
  for (let j = 0, l = attrs.length; j < l; ++j) {
    const key = attrs[j][0];
    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else if (key === 'css-module') {
      token.attrJoin('css-module', attrs[j][1]);
    } else {
      token.attrSet(key, attrs[j][1]);
    }
  }
  return token;
};

/**
 * Does string have properly formatted curly?
 *
 * start: '{.a} asdf'
 * end: 'asdf {.a}'
 * only: '{.a}'
 *
 * @param {'start'|'end'|'only'} where to expect {} curly. start, end or only.
 * @param {Options} options
 * @return {DetectingStrRule} Function which testes if string has curly.
 */
exports.hasDelimiters = function (where, options) {

  if (!where) {
    throw new Error('Parameter `where` not passed. Should be "start", "end" or "only".');
  }

  /**
   * @param {string} str
   * @return {boolean}
   */
  return function (str) {
    // we need minimum three chars, for example {b}
    const minCurlyLength = options.leftDelimiter.length + 1 + options.rightDelimiter.length;
    if (!str || typeof str !== 'string' || str.length < minCurlyLength) {
      return false;
    }

    /**
     * @param {string} curly
     */
    function validCurlyLength (curly) {
      const isClass = curly.charAt(options.leftDelimiter.length) === '.';
      const isId = curly.charAt(options.leftDelimiter.length) === '#';
      return (isClass || isId)
        ? curly.length >= (minCurlyLength + 1)
        : curly.length >= minCurlyLength;
    }

    let start, end, slice, nextChar;
    const rightDelimiterMinimumShift = minCurlyLength - options.rightDelimiter.length;
    switch (where) {
    case 'start':
      // first char should be {, } found in char 2 or more
      slice = str.slice(0, options.leftDelimiter.length);
      start = slice === options.leftDelimiter ? 0 : -1;
      end = start === -1 ? -1 : findRightDelimiter(str, rightDelimiterMinimumShift, options);
      // check if next character is not one of the delimiters
      nextChar = str.charAt(end + options.rightDelimiter.length);
      if (nextChar && options.rightDelimiter.indexOf(nextChar) !== -1) {
        end = -1;
      }
      break;

    case 'end':
      // last char should be }
      start = findLeftDelimiter(str, options);
      end = start === -1 ? -1 : findRightDelimiter(str, start + rightDelimiterMinimumShift, options);
      end = end === str.length - options.rightDelimiter.length ? end : -1;
      break;

    case 'only':
      // '{.a}'
      slice = str.slice(0, options.leftDelimiter.length);
      start = slice === options.leftDelimiter ? 0 : -1;
      slice = str.slice(str.length - options.rightDelimiter.length);
      end = slice === options.rightDelimiter ? str.length - options.rightDelimiter.length : -1;
      break;

    default:
      throw new Error(`Unexpected case ${where}, expected 'start', 'end' or 'only'`);
    }

    return start !== -1 && end !== -1 && validCurlyLength(str.substring(start, end + options.rightDelimiter.length));
  };
};

/**
 * Removes last curly from string.
 * @param {string} str
 * @param {Options} options
 */
exports.removeDelimiter = function (str, options) {
  const start = findLeftDelimiter(str, options);
  if (start === -1) {
    return str;
  }

  const end = findRightDelimiter(str, start + options.leftDelimiter.length, options);
  if (end !== str.length - options.rightDelimiter.length) {
    return str;
  }

  const prefix = str.slice(0, start);
  return /[ \n]$/.test(prefix) ? prefix.slice(0, -1) : prefix;
};

/**
 * Escapes special characters in string s such that the string
 * can be used in `new RegExp`. For example "[" becomes "\\[".
 *
 * @param {string} s Regex string.
 * @return {string} Escaped string.
 */
function escapeRegExp (s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
exports.escapeRegExp = escapeRegExp;

/**
 * find corresponding opening block
 * @param {Token[]} tokens
 * @param {number} i
 */
exports.getMatchingOpeningToken = function (tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  }
  // non closing blocks, example img
  if (tokens[i].nesting === 0) {
    return tokens[i];
  }

  const level = tokens[i].level;
  const type = tokens[i].type.replace('_close', '_open');

  for (; i >= 0; --i) {
    if (tokens[i].type === type && tokens[i].level === level) {
      return tokens[i];
    }
  }

  return false;
};


/**
 * from https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js
 */
const HTML_ESCAPE_TEST_RE = /[&<>"]/;
const HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
const HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

/**
 * @param {string} ch
 * @returns {string}
 */
function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

/**
 * @param {string} str
 * @returns {string}
 */
exports.escapeHtml = function (str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
};

/**
 * Find right delimiter index outside quoted values.
 * @param {string} str
 * @param {number} start
 * @param {Options} options
 * @returns {number}
 */
function findRightDelimiter (str, start, options) {
  let valueInsideQuotes = false;
  for (let i = start; i < str.length; i++) {
    if (isUnescapedDoubleQuote(str, i)) {
      valueInsideQuotes = !valueInsideQuotes;
      continue;
    }
    if (!valueInsideQuotes &&
      str.slice(i, i + options.rightDelimiter.length) === options.rightDelimiter) {
      return i;
    }
  }
  return -1;
}

/**
 * Find last left delimiter index outside quoted values.
 * @param {string} str
 * @param {Options} options
 * @returns {number}
 */
function findLeftDelimiter (str, options) {
  let start = -1;
  let valueInsideQuotes = false;
  for (let i = 0; i < str.length; i++) {
    if (isUnescapedDoubleQuote(str, i)) {
      valueInsideQuotes = !valueInsideQuotes;
      continue;
    }
    if (!valueInsideQuotes &&
      str.slice(i, i + options.leftDelimiter.length) === options.leftDelimiter) {
      start = i;
    }
  }
  return start;
}
exports.findLeftDelimiter = findLeftDelimiter;

/**
 * @param {string} str
 * @param {number} i
 * @returns {boolean}
 */
function isUnescapedDoubleQuote (str, i) {
  if (str.charAt(i) !== '"') {
    return false;
  }
  let slashCount = 0;
  for (let n = i - 1; n >= 0 && str.charAt(n) === '\\'; n--) {
    slashCount++;
  }
  return slashCount % 2 === 0;
}
