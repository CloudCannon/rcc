---
_schema: page
permalink: /docs/javascript-hydration/
title: JavaScript Hydration
layout: layouts/page.html
eleventyNavigation:
  key: JavaScript Hydration
  order: 4
tags: page
SEO_options:
  title:
  image:
  description:
draft: false
---

The RCC supports translation of any static site (likely created via an SSG) that Rosey would support. Anything that relies on JavaScript hydration for text values will need a workaround outside of the default workflow. This is because often your translated values will appear as the initial value on a page's initial load, and then the page or component rerenders with the values contained in your JavaScript. 


Rosey scans your static HTML for elements with `data-rosey` tags and the text those elements contain. If that text is overwritten by JS the translated text will get clobbered by the untranslated JS values. A couple of ideas for workarounds:

- Import the `locales/*.json` file data into the page or component that contains the JS hydration. Add logic in your JS to detect which locale you are in via the page's URL. Add more logic to use the translated value from the appropriate locale file if it exists, rather than the original text. [See an example here](https://github.com/tomrcc/rosey-and-react-demo) in the site's `navigation.jsx` file, which is a React component on an Astro site.

- Hardcode the translated values alongside the original text wherever it is defined in your JS. Then detect whichever locale you are in using the page's url, and use the appropriate values in your JS to hydrate the element with the correct translated text.
