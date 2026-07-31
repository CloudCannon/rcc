---
_schema: docs
permalink: /docs/init/
title: "init CLI"
layout: layouts/page.html
eleventyNavigation:
  key: "init CLI"
  order: 1
tags: "reference"
SEO_options:
  title:
  image:
  description:
draft: false
---
The setup wizard. It inspects your project, installs `rosey` and `rosey-cloudcannon-connector`, writes the postbuild script, and adds the required entries to your CloudCannon config.

```bash
npx rosey-cloudcannon-connector init [options]
```

It runs interactively by default. Pass `--yes` to run headless, for CI and agent automation.

`init` handles the machine-editable parts of setup. It does **not** tag your templates or add the client import to your layout — those are yours to do afterwards, and it prints instructions for both when it finishes. See [Getting Started](/docs/) for the whole picture.

## Options

| Flag | Description |
| --- | --- |
| `-y, --yes` | Skip all prompts and use flags plus defaults |
| `-l, --locales <codes>` | Comma-separated locale codes, e.g. `fr,de,es`. Required in `--yes` mode unless your Rosey config sets `languages` |
| `--default-language <code>` | Default/source language (default: `en`) |
| `-b, --build-dir <dir>` | Build output directory (default: auto-detected, else `dist`) |
| `--rosey-dir <dir>` | Rosey source directory (default: `rosey`) |
| `--write-locales` | Use the built-in `write-locales` command (default) |
| `--no-write-locales` | Scaffold a placeholder for your own locale generation script instead |
| `--content-at-root` | Serve the default language at root URLs (default) |
| `--no-content-at-root` | Serve the default language under a locale prefix, with a redirect at the root |
| `--collection` | Expose locale files as a browsable CloudCannon collection (default) |
| `--no-collection` | Don't create a locales collection |
| `-h, --help` | Show help |

Locale codes are trimmed and lowercased, so `--locales "FR, de"` becomes `fr,de`.

The paired `--x` / `--no-x` flags all default to the positive form. Passing `--write-locales`, `--content-at-root` or `--collection` explicitly is therefore a no-op — useful for being explicit in a CI script, but not required.

### Where defaults come from

For each value, the first source that supplies one wins:

| Value | Precedence |
| --- | --- |
| Locales | `--locales` → `languages` in your Rosey config |
| Default language | `--default-language` → `default_language` in your Rosey config → `en` |
| Build directory | `--build-dir` → `source` in your Rosey config → first of `dist`, `_site`, `build`, `out` that exists → `dist` |
| Rosey directory | `--rosey-dir` → the parent of the `locales` directory in your Rosey config → `rosey` |

Because the Rosey config feeds these, running `init` on a site that already has one usually needs no flags at all. In interactive mode these appear as pre-filled prompt answers, so you can see and override each one.

## Examples

Interactive, answering the prompts yourself:

```bash
npx rosey-cloudcannon-connector init
```

Headless with two locales:

```bash
npx rosey-cloudcannon-connector init --yes --locales fr,de
```

Headless, overriding everything:

```bash
npx rosey-cloudcannon-connector init --yes \
  --locales fr,de,es \
  --default-language en \
  --build-dir dist \
  --rosey-dir rosey \
  --no-content-at-root \
  --no-collection
```

## What it detects

Before asking anything, `init` reports what it found:

- **Rosey config** — `source`, `languages` and `default_language`, read from the environment or your `rosey.{yml,yaml,json}` file
- **CloudCannon config** — the first of the recognised config filenames, and whether it declares a `source` key
- **Build directory** — the first of `dist`, `_site`, `build`, `out` that exists on disk
- **Package manager** — from the lockfile: `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`/`bun.lockb`, or `package-lock.json`, defaulting to npm
- **Installed dependencies** — whether `rosey` and `rosey-cloudcannon-connector` are already in `dependencies` or `devDependencies`
- **Bookshop** — a `bookshop.config.cjs`, `_bookshop/`, or `component-library/bookshop/`
- **Bundled framework** — `astro`, `next`, `nuxt`, `@sveltejs/kit`, `gatsby` or `@remix-run/dev` in your dependencies

That last one changes the output: on a bundled framework the client resolves as a bare specifier, so `init` leaves `install-client` out of the postbuild and tells you to import the package name. Everywhere else it includes the step and tells you to import `/_rcc/client.mjs`. Detection deliberately matches only these frameworks, not bundlers like Vite or esbuild on their own — an Eleventy site can bundle a separate asset entry while its templates stay unbundled, and reading that as "bundled" would silently drop the `install-client` step from a site that needs it. See [SSG Setup](/docs/ssg-setup/).

## What it changes

### 1. Installs dependencies

Installs whichever of `rosey` and `rosey-cloudcannon-connector` are missing, using the detected package manager. With no `package.json` it skips this and prints the command to run yourself.

### 2. Writes `.cloudcannon/postbuild`

If no postbuild exists, `init` creates one with a shebang, executable. If one already exists, the Rosey commands are **appended** under a `# Rosey` comment — nothing already in the file is touched. In interactive mode you see the exact block first and confirm before it's written.

A default run produces:

```bash
#!/usr/bin/env bash

# Rosey
npx rosey generate --source dist
npx rosey-cloudcannon-connector write-locales --source rosey --dest dist --locales fr,de

npx rosey-cloudcannon-connector install-client --dest dist

mv ./dist ./_untranslated_site
npx rosey build --source _untranslated_site --dest dist --default-language en --default-language-at-root --exclusions "\.(html?)$"
```

`--no-content-at-root` drops the `--default-language-at-root` flag from the last line. A detected bundled framework drops the `install-client` line.

With `--no-write-locales`, the `write-locales` call is replaced by a commented TODO block naming the three things your own script has to do — read `base.json`, write the per-locale files, and write the manifest to `{buildDir}/_rcc/locales.json`. See [Using your own script](/docs/write-locales/#using-your-own-script-instead-of-write-locales) for the full contract.

### 3. Removes a `source` key from your CloudCannon config

A CloudCannon config with `source:` pointing at a subdirectory breaks locale editing, because the locale files live at the repo root and can't be reached from inside the source directory. `init` removes the key and prepends the old source path to every affected path — under `paths`, `collections_config`, `data_config` and `file_config` — so the rest of your config keeps resolving. Schema paths are skipped, since CloudCannon doesn't apply `source` to them.

In interactive mode you're asked first, and declining leaves a warning. **In `--yes` mode this rewrite happens without a prompt.** Config formats it can't rewrite (`.cjs`) get printed instructions instead.

A `source` of `.` or `/` is treated as no source at all and left alone.

### 4. Updates the CloudCannon config

Adds a `data_config` entry per locale:

```yaml
data_config:
  locales_fr:
    path: rosey/locales/fr.json
  locales_de:
    path: rosey/locales/de.json
```

Unless you pass `--no-collection`, it also adds a `locales` collection so editors can browse and edit the locale files as data files in the sidebar, with `value` typed as `html`, `original` hidden, and `_base_original` shown read-only. See [Editing locale files as a collection](/docs/configuration/#editing-locale-files-as-a-collection).

This step is additive and idempotent: existing `locales_*` entries and an existing `locales` collection are left as they are, so re-running `init` to add a locale won't disturb the others. With no CloudCannon config present, one is created. A `.cjs` config can't be modified programmatically, so the entries are printed for you to paste.

### 5. Prints next steps

The parts `init` can't do for you:

1. Set `CLOUDCANNON_SYNC_PATHS=/rosey/` in your CloudCannon site settings, so `base.json` and the locale files generated during the build are synced back to your repo
2. Make sure your root `<html>` tag carries the right `lang` attribute
3. Tag translatable elements with `data-rosey` — see [Tagging Content](/docs/tagging-content/)
4. Import the client in your layout, in the form matching your SSG — see [SSG Setup](/docs/ssg-setup/)
5. Build once and run `rosey generate` to create the initial `base.json`

## Re-running init

`init` is safe to run again. Dependency installation skips what's present, config edits skip entries that already exist, and postbuild content is appended rather than overwritten.

That last one is the exception worth watching: appending twice gives you two `# Rosey` blocks and a postbuild that runs the whole pipeline twice. When re-running to add a locale, either decline the postbuild step at the prompt or remove the earlier block afterwards.
