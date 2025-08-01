
---
_schema: page
permalink: /docs/known-issues/
title: Known Issues & Workarounds
layout: layouts/page.html
eleventyNavigation:
  key: Known Issues & Workarounds
  order: 2
tags: page
SEO_options:
  title:
  image:
  description:
draft: false
---

<details>
  <summary>Unsupported HTML in markdown</summary>
  
  **Issue**: If HTML exists that cannot be represented as markdown, it won’t make it through to the translations files. 
  
  
  **Solution**: Separate the text to translate from the unsupported HTML. Consider the following example:
    
  ```html
  <li>
    <span data-rosey="{{ item.title | slugify }}">
      {{ item.title }}<i class="some-unrepresentable-html"></i>
    </span>
  </li>
  ```
    
  Could be refactored to something like:
    
  ```html
  <li>
    <span data-rosey="{{ item.title | slugify }}">{{ item.title }}</span>
    <span><i class="some-unrepresentable-html"></i></span>
  </li>
  ```
</details>

<details>
  <summary>Wrapping double quotes</summary>
  
  **Issue**: If an untranslated phrase has quotes wrapping the whole phrase (quotes in the middle are fine), the quotes won’t make it through the `rosey generate` step into the `base.json`. This means the phrase won’t have quotes in the translations file, and also won't have quotes present on the label for the translation.


  **Solution**: If you want the translation to have wrapping quotes like the original, you can enter them in the translation file and they will make it through to the translated site.
</details>

