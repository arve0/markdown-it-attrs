This is an issue template. Fill in your problem description here, replacing this text. Below you should include examples.

Markdown-it versions:

```bash
# run this command and copy the output
npm ls | grep markdown-it
```

Example input:

```md
this is the markdown I'm trying to parse {.replace-me}
```

Current output:

```html
<p class="replace-me">this is the markdown I'm trying to parse</p>
```

Expected output:

```html
<p class="replace-me">this is the markdown I'm trying to parse</p>
```
