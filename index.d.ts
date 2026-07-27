import MarkdownIt = require('markdown-it');

declare namespace markdownItAttrs {
  type AllowedAttribute = string | RegExp;

  interface Options {
    leftDelimiter?: string;
    rightDelimiter?: string;
    allowedAttributes?: AllowedAttribute[];
    allowedAttributeValues?: AllowedAttribute[];
    fenceAttrsOnPre?: boolean;
    errorHandler?: (error: Error, patternName: string) => void;
  }
}

declare function markdownItAttrs(md: InstanceType<typeof MarkdownIt>, options?: markdownItAttrs.Options): void;

export = markdownItAttrs;
