# Changelog

## v1.2.0 (October 7, 2025)

- Added customizable markdown keys in config.
- Added config option `index_html_pages_only` for pages built at eg. `about.html` instead of `about/index.html`.
- Remove translation files who only contain id's that have been removed from the built site.
- Fixed bug where cleared translations don't always update the `locale.json` file.
- Added automatic config migrator for configs missing new keys.
