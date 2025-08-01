---
_schema: page
permalink: /docs/known-issues/
title: Known Issues & Workarounds
layout: layouts/page.html
eleventyNavigation:
  key: Known Issues & Workarounds
  order: 5
tags: page
SEO_options:
  title:
  image:
  description:
draft: false
---
## Unsupported HTML in markdown

**Issue**: If HTML exists that cannot be represented as markdown, it won’t make it through to the translations files.

**Solution**: Separate the text to translate from the unsupported HTML. Consider the following example:

```html
<li>

  <span data-rosey="{% raw %}{{ item.title | slugify }}{% endraw %}">
    {% raw %}{{ item.title }}{% endraw %}<i class="some-unrepresentable-html"></i>
  </span>
</li>
```

Could be refactored to something like:

```html
<li>
  <span data-rosey="{% raw %}{{ item.title | slugify }}{% endraw %}">{% raw %}{{ item.title }}{% endraw %}</span>
  <span><i class="some-unrepresentable-html"></i></span>
</li>
```

## Wrapping double quotes

**Issue**: If an untranslated phrase has double quotes wrapping the whole phrase (quotes in the middle are fine), the quotes themselves won’t make it through the `rosey generate` step into the `base.json`. This means the phrase won’t have quotes in the translations file, and also won't have quotes present on the label for the translation.

**Solution**: If you want the translation to have wrapping quotes like the original, you can still manually enter them in the translation file and they will make it through to the translated site.