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

## License

MIT © [Arve Seljebu](http://arve0.github.io/)
