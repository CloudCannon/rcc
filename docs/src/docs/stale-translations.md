---
_schema: docs
permalink: /docs/stale-translations/
title: "Stale Translation Detection"
layout: layouts/page.html
eleventyNavigation:
  key: "Stale Translation Detection"
  order: 4
tags: "guides"
SEO_options:
  title:
  image:
  description:
draft: false
---
When source text changes after a translation was last reviewed, the connector highlights out-of-date translations in the Visual Editor. This helps editors keep translations in sync with evolving content without losing track of what needs attention.

## How it works

Each locale entry stores three fields:

| Field | Role |
| --- | --- |
| `original` | The source text when the translation was last acknowledged or edited |
| `value` | The translated text |
| `_base_original` | The current source text from `base.json`, updated by `write-locales` on every build |

A translation is **stale** when the current source text differs from `original` — the source content has changed since the translation was last reviewed. The connector checks this two ways, and flags the translation if **either** fires:

- **Build signal** — `_base_original` (the source as of the last build) differs from `original`. This is persisted in the locale file, so it surfaces whenever the page is opened.
- **Live signal** — the source text on the page *right now* differs from `original`. This catches an in-session source edit **immediately**, before any save or rebuild has refreshed `_base_original`. (Reading `base.json` instead wouldn't help here — it's a build artifact of the same vintage as `_base_original`. The only pre-rebuild source of truth is the rendered page itself.)

Both comparisons normalize before comparing, to avoid spurious flags from insignificant serialization differences: Rosey's `base.json` extract and CloudCannon's editor serialize the same content differently (whitespace between tags, `<br/>` vs `<br>`, and tight vs loose markdown lists — `<li>x</li>` vs `<li><p>x</p></li>`). They normalize at different levels, because they compare different things:

- The **build signal** compares markup, so it collapses the whitespace between tags and unwraps single-paragraph list items, leaving a formatting-only source change (a word bolded) visible.
- The **live signal** compares the visible text only — markup is discarded entirely, which is what makes it immune to serializer differences it has never seen. Block boundaries still count as word boundaries, so `<p>One.</p><p>Two.</p>` reads as "One. Two." no matter which serializer wrote it. The trade-off is that a source edit which only changes formatting won't fire the live signal; the build signal catches it on the next build.

Both comparisons are also skipped for entries with no `_base_original` (see [Opting out](#opting-out)).

### Example

A translator reviewed the title when it said "Welcome to Sendit" and entered a French translation:

```json
{
  "hero:title": {
    "original": "Welcome to Sendit",
    "value": "Bienvenue chez Sendit",
    "_base_original": "Welcome to Sendit"
  }
}
```

Later, an editor changes the English title to "Welcome to Sendit — Email Made Easy". The next build updates `_base_original` but leaves `original` untouched:

```json
{
  "hero:title": {
    "original": "Welcome to Sendit",
    "value": "Bienvenue chez Sendit",
    "_base_original": "Welcome to Sendit — Email Made Easy"
  }
}
```

Now `original !== _base_original`, so the connector flags this translation as stale.

## Visual indicators

When viewing a locale in the Visual Editor, stale translations show:

- **Grey and yellow dashed outline** around the translatable element — grey for "out of date", yellow to keep CloudCannon's editable cue. There is no background fill, so it stays legible over any page design.
- **Grey count badge** on the bottom-left corner of the locale FAB, showing the total number of stale translations for the current locale
- **Stale items panel** — each locale button in the popover has a toggle that opens a list of all stale translations. Each item lets you:
  - **Click the text** to scroll to that element on the page and drop the cursor into its editor.
  - **Expand the chevron** to see *what changed* in the source — an inline word-level diff of the old vs current English, with added words highlighted and removed words struck through.
  - **Click the checkmark** to mark that item as reviewed.

  A **"Mark all as reviewed"** button at the bottom clears every item at once.

## Resolving stale translations

There are three ways to clear the stale indicator:

### 1. Edit the translation

Making any edit to the translation automatically updates `original` to match `_base_original`. The stale indicator disappears and the translator can adjust the text to reflect the new source content.

### 2. Mark as reviewed

Click the checkmark button next to a specific item in the stale panel. This updates `original` to match `_base_original` without changing the translation text — useful when the source change doesn't affect the translation (e.g. a typo fix in the English text that doesn't change the meaning). Expand the item's chevron first to see exactly what changed before deciding.

### 3. Mark all as reviewed

Click "Mark all as reviewed" in the stale panel to clear every stale translation in the current locale at once.

After any of these actions, the stale indicator is removed and won't appear again until the source text changes once more.

## Lifecycle

1. **Build time:** `write-locales` runs and sets `_base_original` to the current `base.json` original for every entry. It never modifies `value`, and only ever rewrites `original` to a string that says exactly the same thing — see [Serialization](#serialization) below.
2. **Source changes (in session):** An editor changes the source text in the Visual Editor. The next time they view a locale, the **live signal** flags the affected translations as stale right away — no save or rebuild needed.
3. **Source changes (across builds):** When a source change is built, `write-locales` updates `_base_original`, creating a mismatch with `original`. The **build signal** then surfaces the staleness whenever the page is opened.
4. **Editor time:** Editing a translation, or marking it reviewed, sets both `original` and `_base_original` to the reviewed source, clearing staleness. That is the last build's source text, unless the source was changed in the same session — then it's what's on the page, because nothing else has that content yet. (Writing both keeps the entry self-consistent even when resolving before a build; the next build's `_base_original` refresh reconciles harmlessly.)
5. **Review:** The editor sees the stale indicator and either edits the translation, marks it as reviewed, or resolves all.

## Serialization

Two different tools write the HTML these fields hold. Rosey copies the built page into `base.json` verbatim, newlines and all. CloudCannon's editor re-serializes from its own model, which drops the whitespace between blocks. Neither is wrong, and the difference never means an editor changed anything.

The connector keeps them apart rather than trying to reconcile them everywhere:

- `_base_original` is always Rosey's, straight from the build.
- `original` is Rosey's too, wherever a Rosey string for that content exists. Resolving or editing writes the last build's source, not the page's markup — the page is only used when the source itself changed in session, which is the one case nothing else has recorded yet.
- When an `original` does end up in the editor's serialization — from an older version, or from that in-session case — the next `write-locales` run rewrites it to the build's string once it can see the two say the same thing. Only the anchor moves; `value` is never touched. The build log reports these as `N healed`.

The practical effect is that locale files converge on one serialization, and the field-to-field comparison behind the build signal stays a straightforward one.

## Opting out

Stale detection requires the `_base_original` field. If you're using your own script instead of `write-locales` and don't include `_base_original` on an entry, stale detection is skipped for that entry — no indicators will appear.

See [write-locales: Using your own script](/docs/write-locales/#using-your-own-script-instead-of-write-locales) for details on the expected locale file format.
