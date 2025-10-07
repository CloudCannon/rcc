# Changelog

## v1.2.0 (October 7, 2025)

- Added customizable markdown keys in config.
- Added config option `index_html_pages_only` for pages built at eg. `about.html` instead of `about/index.html`.
- Remove translation files who only contain id's that have been removed from the built site.
- Fixed bug where cleared translations don't always update the `locale.json` file.
- Added automatic config migrator for configs missing new keys.

## v1.2.1 (October 7, 2025)

- Fixed bug where the `index.html` yaml translation file was incorrectly named `index.html` instead of `index.yaml`.

## v1.2.2 (October 7, 2025)

- Fixed bug where the `index.yaml` yaml translation file was incorrectly being archived.
