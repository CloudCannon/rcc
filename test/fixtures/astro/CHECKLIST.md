# Astro fixture — Visual-Editor checklist

The automated `verify-*.mjs` scripts cover the build output. This list covers
what only the live editor can show (gated on `window.inEditorMode` +
`window.CloudCannonAPI`, CloudCannon's proprietary runtime — not reproducible
headlessly).

## Setup
1. In `rcc-v2/`, run `npm run build` (fresh `dist/`; the fixture symlink reflects
   it instantly — no reinstall needed).
2. Open `test/fixtures/astro` as its own CloudCannon site; enter the Visual Editor.
3. Open the browser console — it must print **`RCC: loaded`**.

## Walk
- [ ] The locale-switcher FAB appears (bottom corner).
- [ ] **Switch to `ar`** → the content flips to RTL (`dir="rtl"` on the swapped
      container); switch to `fr` → back to LTR.
- [ ] **Stale** (`/stale/`): only `stale:changed` shows the grey/yellow dashed outline
      and appears in the stale panel. `stale:uptodate` and `stale:untranslated`
      do **not**. `stale:untranslated` renders its source text in a normal editor
      (its `value` equals `original`) — no empty box.
- [ ] Resolve the stale item (✓ in the panel) → the outline clears and the panel
      count drops.
- [ ] **Panel updates in place**: with two or more stale items, expand one item's
      diff, scroll the list, then resolve a *different* item → only that row goes.
      The expanded diff stays open and the list keeps its scroll position.
- [ ] **Mark all as reviewed** clears every row in one go and shows "Nothing needs
      review" before the panel closes itself.
- [ ] **First translation** (`stale:untranslated`): type over the source text →
      `fr.json` takes it as `value`; `original`/`_base_original` stay English. The
      entry already existed, so this is the ordinary `set("<key>.value")` write.
- [ ] **Fresh translation** (`stale:fresh`): no locale entry at all — the postbuild
      strips it (`strip-fresh-key.mjs`), so this is the only place the
      create-a-new-entry path is reachable. It shows its source text (not an empty
      box), is editable, and is **not** stale. Type a translation → verbose logs
      show `creating new locale entry` and `fr.json` gains all three fields (source
      as `original` + `_base_original`). The next build strips the key again, so
      losing that entry is the scenario resetting, not a bug.
- [ ] **Duplicates** (`/duplicates/`): edit one `shared` paragraph → the other
      updates to match. The sibling with no `data-rosey` is **not** editable.
- [ ] **Duplicate + stale**: with a stale duplicate pair and the panel open, edit
      one instance → its row goes, and the sibling's remaining row relabels to the
      new text (~150ms later, when the sibling sync lands) rather than keeping the
      pre-edit label.
- [ ] **Nested** (`/nested/`): the deep element is editable and its key resolves
      to `nested:section:card:*` (verbose logs show it with `?data-rcc-verbose`).
- [ ] **Index** (`/`): the no-`data-rosey` paragraph is **not** editable.
- [ ] **Markdown** (`/markdown/`): open the `article` editable → the toolbar shows
      **every** configured button (bold/italic/underline/strike/sub/sup/code,
      formats, blockquote, lists, indent/outdent, link, image, table, hr,
      remove/copy format, undo/redo). Edit a nested list / table cell → rebuild
      → the entry is **not** falsely stale.
- [ ] **Multi-block source** (`/markdown/`): resolve or edit `article`, then switch
      away and back **without rebuilding** → it must not return as stale. The
      resolve leaves the entry in CC's serialization while the page is in Rosey's,
      which is the state where a live signal that welded blocks together
      (`files.Visual`) would flag it on every load.
- [ ] **Healing**: rebuild after that resolve → `git diff rosey/locales/fr.json`
      shows `original` back in Rosey's form (newlines between blocks), with the
      translation unchanged.
