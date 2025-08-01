---
_schema: page
permalink: /docs/tagging-content/
title: Tagging Content
layout: layouts/page.html
eleventyNavigation:
  key: Tagging Content
  order: 2
tags: page
SEO_options:
  title:
  image:
  description:
draft: false
---

## Manual tagging

To add text content to translate, start tagging your layouts and components with `data-rosey` tags.


Some SSGs - like Eleventy - come with a global `slugify` filter, which you can use to turn the tagged element's text content into an ID friendly slug, and use that as the translation key. 


An example tag in [Eleventy](https://www.11ty.dev/) may look like:

<!-- TODO: Fix this so it's not parsed -->
```liquid
  <h1 class="heading" data-rosey="{{ heading.heading_text | slugify }}">{{ heading.heading_text }}</h1>
```


If you are using an SSG that doesn't have a `slugify` filter built in - like Astro - you can import a helper function to generate the Rosey IDs. One has been provided at `rosey-cloudcannon-connector/utils`.

An example tag in [Astro](https://astro.build/) may look like:

```html
  ...
  import { generateRoseyId } from "rosey-cloudcannon-connector/utils";

  const { heading } = Astro.props;
  ---

  <h1 class="heading" data-rosey={generateRoseyId(heading.heading_text)}>
    {heading.heading_text}
  </h1>
```

## Automatic tagging

Most sites using an SSG will have at least some content that comes from markdown, which gets from markdown into HTML as part of the build step. Markdown from a frontmatter field will usually be run through something like a `markdownify` filter. Markdown body content will usually be run through the SSGs markdown parsing step.


Both are turned into the HTML needed by your actual live site as part of your build, meaning you won't see it as HTML until the site is actually built. This makes it hard to add `data-rosey` tags to manually.


For this purpose, the `npx rosey-cloudcannon-connector tag` command has been provided. In the [Getting Started](#getting-started) steps, we added it to the CloudCannon `postbuild` file so that it runs after every build, but before the rest of the Rosey workflow.


It walks your site's built HTML, and looks for any elements with the attribute `data-rosey-tagger`. It then tags any block elements nested inside of that parent element with `data-rosey` tags, using the slugified text content of that element as the value of the tag. The most nested block elements inside of the element with the `data-rosey-tagger` attribute will be the ones to receive the tag, so that there is never a `data-rosey` tag inside of a `data-rosey` tag.


This is primarily used to tag markdown that was turned into HTML during the build, wherever that lives - be it in your layouts or components - but could optionally also be used on any element. For example you could add it to the `<body>` tag of a page for the most nested block level elements on that page to be tagged automatically. 


You shouldn't nest one `data-rosey-tagger` inside of another, however it should respect existing tags you've added manually, and not overwrite them. 


> When using the `rosey-tagger` with markdown, add a Rosey namespace of `data-rosey-ns="rcc-markdown"` on the element containing markdown, so that the generated inputs for that translation are `type: markdown` in CloudCannon, which will allow editors the same options in the translation input as are allowed for the original content.


If you don't have one of these `data-rosey-tagger` tags on any of your pages it won't do anything, so can be ignored or removed. If no translation is provided for an element, the original will be used. This means even if you tag everything, but don't want to provide a translation for it, the original will be shown in your translated version, rather than a blank space.

## Namespace pages

Sometimes you don't want a piece of content that appears many times on different pages to be represented in each translation file. Duplicate translation keys (translations with the same ID) across pages *will* be kept in sync with each other, but it can clutter up your translation files. The most common example of this would be the text used in your header and footer navigation.


To help with this issue, you can add a [Rosey namespace](https://rosey.app/docs/namespacing/) to an element and any elements nested inside of that element with `data-rosey` tags will receive the namespace as part of their Rosey ID. Separate translation files will be generated for each value in the `namespace_pages` list in the `rcc.yaml` config file. If an ID is seen to start with one of these defined namespaces, the translation will reside in the namespace file instead of the actual page(s) translation files that it appears on.


By default the value `common` is used as the value for `namespace_pages`, defined in the `rcc.yaml` file under the key `namespace_pages`. You can change this to whatever name you like, or add more than one namespace page.


An example for a header component in Astro might look like:

```jsx
---
import { generateRoseyId } from "rosey-cloudcannon-connector/utils";

const { links } = Astro.props;
---

<header
  data-rosey-ns="common">
  <ul>
    {
      links.map((link) => {
        return (
          <li>
            <a
              href={link.link}
              data-rosey={generateRoseyId(link.text)}>
              {link.text}
            </a>
          </li>
        );
      })
    }
  </ul>
</header>
```


You cannot use the namespace `rcc-markdown` for a namespace page, as that is reserved for use by the RCC to nominate which inputs should be `type: markdown`.