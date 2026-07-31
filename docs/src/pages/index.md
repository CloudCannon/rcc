---
_schema: page
permalink: /
title: Rosey CloudCannon Connector
layout: layouts/page.html
eleventyNavigation:
  key: Home
  order: 0
tags: page
SEO_options:
  title:
  image:
  description:
draft: false
---

Client-side locale switching for [Rosey](https://rosey.app/) translations in [CloudCannon's](https://cloudcannon.com/) Visual Editor.

The connector auto-detects every `data-rosey` tagged element on the page, injects a floating locale switcher, and creates inline editors wired to your locale data files through CloudCannon's live editing API. Editors translate in context, on the page, seeing exactly what a visitor will see. No server-side conditionals, no per-locale routing, no component refactoring.

## How it works

1. A developer tags translatable elements with `data-rosey` attributes.

2. On each CloudCannon build, Rosey scans the built HTML and generates `base.json` — every tagged phrase on the site.

3. `write-locales` syncs that into one flat JSON file per locale in `rosey/locales/`, adding new keys, preserving existing translations, and dropping keys that no longer exist.

4. In the Visual Editor, the connector reads those locale files through CloudCannon's data API. Editors switch locale from a floating button and edit translations inline; edits are written straight back to the JSON.

5. Rosey ingests the locale files at the end of the build and generates the complete multilingual site.

Everything after step 1 runs in your site's postbuild, so it happens automatically on every build.

## What you need

- A static site built with any SSG — Astro, Hugo, Eleventy, Jekyll, and anything else that outputs static HTML
- The site hosted on [CloudCannon](https://cloudcannon.com/), with the Visual Editor enabled
- [Rosey](https://rosey.app/) v2 generating `base.json` from your built site
- Elements tagged with `data-rosey`

**No existing editing setup is required.** The connector doesn't depend on editable regions or Bookshop — it creates its own inline editors on every `data-rosey` element, so a site with no editing infrastructure still gets full visual translation editing. Editable regions and Bookshop are compatible enhancements that the connector handles automatically, not prerequisites.

## Install

```bash
npx rosey-cloudcannon-connector init
```

The `init` wizard installs dependencies, writes the postbuild script, and configures `cloudcannon.config.yml`. From there you tag your templates and import the client in your layout — see [Getting Started](/docs/).

## What's in the box

- **A client-side injector** that auto-runs in the Visual Editor and does nothing outside it
- **Three CLI tools** — [`init`](/docs/init/), [`write-locales`](/docs/write-locales/), and `install-client`
- **[Stale translation detection](/docs/stale-translations/)** — when source text changes after a translation was reviewed, the element gets a grey-and-yellow dashed outline and the switcher shows a count badge, with a panel to resolve items individually or all at once
- **[RTL support](/docs/rtl-support/)** — switching to Arabic, Hebrew, Farsi and friends flips the editing surface automatically

Agent skills for AI-assisted translation and setup are maintained separately in [CloudCannon/agent-skills](https://github.com/CloudCannon/agent-skills).

## Is this workflow right for you?

Depending on your use case this workflow could be unnecessary, and you may be better served by dividing your language content into separate directories and maintaining each separately. Read [this blog post](https://cloudcannon.com/blog/managing-multilingual-content-in-cloudcannon/) before getting started with the RCC.

The two approaches also combine well: [split-by-directory translation](/docs/split-by-directory/) handles long-form body content through per-locale content collections, while Rosey handles the shared UI strings around it.

## Upgrading from v1

v1 was a form-based workflow — translations were edited as YAML in CloudCannon's Data Editor, and the package shipped an auto-tagger and a Smartling integration. v2 replaces all of that with inline editing in the Visual Editor. Same npm package name, different workflow. See [Migrating from v1](/docs/migration-from-v1/) for the step-by-step upgrade, including how to remap existing translations onto new keys.

Already running a different i18n system? See [Migrating from an i18n System](/docs/migrating-from-i18n/).
