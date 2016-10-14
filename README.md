# markdown-it-attrs [![Build Status](https://travis-ci.org/arve0/markdown-it-attrs.svg?branch=master)](https://travis-ci.org/arve0/markdown-it-attrs) [![npm version](https://badge.fury.io/js/markdown-it-attrs.svg)](http://badge.fury.io/js/markdown-it-attrs)

Add classes, identifiers and attributes to your markdown with `{.class #identifier attr=value attr2="spaced value"}` curly brackets, similar to [pandoc's header attributes](http://pandoc.org/README.html#extension-header_attributes).

Example input:
```md
# header {.style-me}
paragraph {data-toggle=modal}
```

Output:
```html
<h1 class="style-me">header</h1>
<p data-toggle="modal">paragraph</p>
```

Works with inline elements too:
```md
paragraph *style me*{.red} more text
```

Output:
```html
<p>paragraph <em class="red">style me</em> more text</p>
```

And fenced code blocks:
<pre><code>
```python {data=asdf}
nums = [x for x in range(10)]
```
</code></pre>

Output:
```html
<pre><code data="asdf" class="language-python">
nums = [x for x in range(10)]
</code></pre>
```

**Note:** Plugin does not validate any input, so you should validate the attributes in your html output if security is a concern.


## Ambiguity
When class can be applied to both inline or block element, inline element will take precedence:
```md
- list item **bold**{.red}
```

Output:
```html
<ul>
<li>list item <strong class="red">bold</strong></li>
<ul>
```

If you need the class to apply to the list item instead, use a space:
```md
- list item **bold** {.red}
```

Output:
```html
<ul>
<li class="red">list item <strong>bold</strong></li>
</ul>
```

If you need the class to apply to the ul element, use a new line:
```md
- list item **bold**
{.red}
```

Output:
```html
<ul class="red">
<li>list item <strong>bold</strong></li>
</ul>
```

Unfortunately, as of now, attributes on new line will apply to opening `ul` or `ol` for previous list item:
```md
- applies to
  - ul of last
  {.list}
{.item}


- here
  - we get
  {.blue}
- what's expected
{.red}
```

Which is not what you might expect. [Suggestions are welcome](https://github.com/arve0/markdown-it-attrs/issues/32). #. Output:
```html
<ul>
  <li>applies
    <ul class="item list">
      <li>ul of last</li>
    </ul>
  </li>
</ul>

<ul class="red">
  <li>here
    <ul class="blue">
      <li>we get</li>
    </ul>
  </li>
  <li>what's expected</li>
</ul>
```

If you need finer control, look into [decorate](https://github.com/rstacruz/markdown-it-decorate).


## Install

```
$ npm install --save markdown-it-attrs
```


## Usage

```js
var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attrs');

md.use(markdownItAttrs);

var src = '# header {.green #id}\nsome text {with=attrs and="attrs with space"}';
var res = md.render(src);

console.log(res);
```

[demo as jsfiddle](https://jsfiddle.net/arve0/hwy17omn/)


## Custom blocks
`markdown-it-attrs` will add attributes to any `token.block == true` with {}-curlies in end of `token.info`. For example, see [markdown-it/rules_block/fence.js](https://github.com/markdown-it/markdown-it/blob/760050edcb7607f70a855c97a087ad287b653d61/lib/rules_block/fence.js#L85) which [stores text after the three backticks in fenced code blocks to `token.info`](https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%60%60%60js%20%7B.red%7D%5Cnfunction%20%28%29%20%7B%7D%5Cn%60%60%60%22%2C%22defaults%22%3A%7B%22html%22%3Afalse%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22language-%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Atrue%2C%22_highlight%22%3Atrue%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22debug%22%7D%7D).

Remember to [render attributes](https://github.com/arve0/markdown-it-attrs/blob/a75102ad571110659ce9545d184aa5658d2b4a06/index.js#L100) if you use a custom renderer.

## License

MIT © [Arve Seljebu](http://arve0.github.io/)
