# Rosey CloudCannon Connector

Read [this blog post](https://cloudcannon.com/blog/managing-multilingual-content-in-cloudcannon/) before getting starting with the RCC.


[Rosey](https://rosey.app/) is used to generate a multilingual site from tagged HTML and a set of JSON files.

How Rosey works at a high level:

  1. A developer tags HTML elements on your site for translation using `data-rosey` tags.

  2. Rosey scans your built static site for `data-rosey` tags and generates a JSON file named `base.json`, containing information about your tagged content.

  3. Rosey ingests `locales/*.json` files, which contain original phrases paired with user entered translations. From this data, and your tagged content, Rosey generates a complete multilingual site.

**What the RCC does** is create a way for non-technical editors to create the `locales/*.json` files that Rosey needs to generate the site. Using the `base.json` file, editor-friendly YAML files are generated with the correct CloudCannon input configuration to enable translations to be entered via CloudCannon's CMS. The YAML files are then turned into the `locales/*.json` files JSON files needed by Rosey. All of this happens in your site's postbuild, meaning it happens automatically each build.

## Getting started

### CloudCannon setup

#### Option 1: Staging -> Production workflow

This option is for you if you want to use the default redirect that comes with Rosey, and don't mind your original version being prefixed with a locale code. For example if your original untranslated content is in English, it would be served at `/en/`, like all the other translated locales.

1. Create two sites using a `staging` -> `production` [publishing workflow](https://cloudcannon.com/documentation/articles/what-is-a-publish-branch/) on CloudCannon, if you don't already have one.

2. On your `staging` site add the [environment variable](https://cloudcannon.com/documentation/articles/configure-your-environment-variables/) `SYNC_PATHS`, with the value `/rosey/`.

3. On your `production` site add the environment variable `ROSEYPROD`, with a value of `true`.

4. Add a `.cloudcannon` directory in the root of your project if you don't have one already. Add a `postbuild` file to it, replacing `dist` with the build output directory of your project. If you already have a CloudCannon postbuild file, add this logic to your current one.

  `.cloudcannon/postbuild`

  ```bash
    #!/usr/bin/env bash

    if [[ $ROSEYPROD != "true" ]];
    then
      node rosey-tagger/main.mjs --source dist # Add the flag --verbose for more logs
      npx rosey generate --source dist
      node rosey-connector/main.mjs
    fi

    if [[ $ROSEYPROD == "true" ]];
    then
      node rosey-tagger/main.mjs --source dist
      echo "Translating site with Rosey"
      mv ./dist ./untranslated_site                  
      npx rosey build --source untranslated_site --dest dist 
    fi
  ```

#### Option 2: Everything happens on one site

You can use this option if you don't need the default redirect that comes with Rosey. Your original content will be served at the root of your URL, without a prefix.

1. Create a site on CloudCannon.

2. Add the environment variable `SYNC_PATHS`, with the value `/rosey/`.

3. Add a `.cloudcannon` directory in the root of your project if you don't have one already. Add a `postbuild` file to it, replacing `dist` with the build output directory of your project. If you already have a CloudCannon postbuild file, add this logic to your current one.

  `.cloudcannon/postbuild`

  ```bash
    #!/usr/bin/env bash

    node rosey-tagger/main.mjs --source dist # Add the flag --verbose for more logs
    npx rosey generate --source dist
    node rosey-connector/main.mjs

    echo "Translating site with Rosey"
    mv ./dist ./untranslated_site                  
    npx rosey build --source untranslated_site --dest dist --default-language-at-root
  ```

### Rosey setup

1. Copy the following dependencies to your project's `package.json` and run `npm i`.

    `package.json`:

    ``` json
    "dependencies": {
      "markdown-it": "^13.0.1",
      "rosey": "^2.3.3",
      "dotenv": "^16.4.5",
      "slugify": "^1.6.6",
      "yaml": "^2.4.2",
      "unified": "^11.0.5",
      "rehype-remark": "^10.0.1",
      "rehype-parse": "^9.0.1",
      "remark-stringify": "^11.0.0",
      "rehype-format": "^5.0.1",
      "unist-util-visit": "^5.0.0",
      "smartling-api-sdk-nodejs": "^2.11.0",
    }
    ```

2. Copy the `rosey-connector`, and `rosey-tagger` directories to your project. Commit your changes, and wait for the CloudCannon build to finish. Then pull your changes down to your local. 


    All the files you need will be generated  to get going. In your generated `rosey/rcc.yml` **add at least one language code to the `locales` array**,  add your cloudvent URL (the staging one if using the publishing workflow) as the value of the `see_on_page_comment.base_url` key, and add your Git repo as the value of the `git_history_link.repo_url` key.


    Once again wait for the CloudCannon build to finish. Then pull your changes down to your local.

3. Add a `translations` collection to your `cloudcannon.config.yml`. If you have the [collection_groups](https://cloudcannon.com/documentation/articles/configure-your-site-navigation/#options) configuration key defined, remember to add `translations` to a collection group, so that it is visible in your sidebar in CloudCannon. 


    If your site is nested in a subdirectory and you're using the [source](https://cloudcannon.com/documentation/articles/configuration-file-reference/#source) key you'll need to remove it, and manually add the subdirectory to each path that needs it (probably just your collections). The translations collection's path `rosey` does not need the prefix of the subdirectory since it lives in the root of our project. Schema paths in CloudCannon are not affected by the `source` key, so do not need updating.

    `cloudcannon.config.yml`

    ```yml
      collections_config:
        translations:
          path: rosey
          icon: translate
          disable_url: true
          disable_add: true
          disable_add_folder: true
          disable_file_actions: false
          glob:
            - rcc.yaml
            - 'translations/**'
          _inputs:
            urlTranslation:
              type: text
              comment: Provide a translated URL, and Rosey will build this page at that address.
    ```

## Tagging content for translation

### Manual tagging

After your next build in CC, you should see empty translations files. A URL input will be generated for you to translate the page's URL if need be, without anything in your site needing to be tagged. To add text content to translate, start tagging your layouts and components with `data-rosey` tags.

An example tag in [Eleventy](https://www.11ty.dev/) may look like:

```liquid
  <h1 class="heading" data-rosey="{{ heading.heading_text | slugify }}">{{ heading.heading_text }}</h1>
```

Eleventy comes with the `slugify` global filter, which you can use to turn the tagged elements content into an ID friendly slug, and use that as the translation key. If you are using an SSG that doesn't have a `slugify` filter built in - like Astro - you can import a helper function which has been provided in  `rosey-connector/helpers/component-helper.js`.

An example tag in [Astro](https://astro.build/) may look like:

```jsx
  ...
  import { generateRoseyId } from "rosey-connector/helpers/component-helpers.mjs";

  const { heading } = Astro.props;
  ---

  <h1 class="heading" data-rosey={generateRoseyId(heading.heading_text)}>
    {heading.heading_text}
  </h1>
```

### Automatic tagging

Most sites using an SSG will have at least some content that comes from markdown, and gets run through a `markdownify` filter, or somehow turned from markdown to HTML. For example, any body content in a markdown file will go through this process as part of the SSG's build. This markdown content is hard to tag manually.


For this the `rosey-tagger` directory has been provided. In the [Getting Started](#getting-started) steps above, we've added it to the CloudCannon `postbuild` so that it runs after every build, and before the rest of the Rosey workflow. Tag a parent element with the attribute `data-rosey-tagger="true"` and block elements inside of the parent element will be tagged for translation automatically. The most nested block element will be the one to receive the tag, so that there isn't a `data-rosey` tag inside of a `data-rosey` tag.


This is especially useful to wrap your markdown body content, wherever that goes in your layouts or components, but can be used on any element. For example you could add it to the `<body>` tag of a page for every block level element in that page to be tagged automatically. You shouldn't nest one `data-rosey-tagger="true"` inside of another, however it should respect existing tags you've added manually, and not overwrite them. 


> [!IMPORTANT]
> When using the `rosey-tagger` with markdown, add a Rosey namespace of `data-rosey-ns="markdown"` on the element containing markdown, so that generated inputs for that content are `type: markdown` in CloudCannon, which will allow editors the same options in the translation input as are allowed for the original content.


If you don't have one of these `data-rosey-tagger="true"` tags on any of your pages it won't do anything, so can be ignored or removed. If no translation is provided for an element, the original will be used. This means even if you tag everything but don't want to provide a translation for it the original will be shown in your translated version, rather than a blank space.

## Namespaced pages

Sometimes you don't want a piece of content that appears many times on different pages to be represented on each translation page. Duplicate translation keys (translations with the same ID) across pages *will* be kept in sync with each other, but it can clutter up your translation files. The most common example would be text used in your header and footer content.


For this you can add a `data-rosey-ns` tag similar to the `markdown` example given in [Automatic tagging](#automatic-tagging) (although markdown is a reserved namespace when using the RCC), and add the value of the tag to the `namespace_page` field in the `rcc.yaml` configuration file. This will cause any translations that are nested under this namespace to appear on a separately generated page, and be ommited from the normal translations for that page. 


By default a `common` namespace page comes with this workflow, although you can configure it to be whatever you wish by adding/editing the values in the `namespace_pages` array in the `rcc.yaml` configuration file. 

## Smartling integration

To add automatic AI-powered translations - which your editors can then QA in the app - enable Smartling in your `rosey/config.yaml` file, by setting `smartling_enabled: true`. Make sure to fill in your `dev_project_id`, and `dev_user_identifier`, with the credentials in your Smartling account. Add your secret API key to your environment variables with the key of `DEV_USER_SECRET` in CloudCannon on your staging site (or your only site if you're not using a publishing workflow). You can set this locally in a `.env` file if you want to test it in your development environment. 

> [!IMPORTANT]
> Make sure to not push any secret API keys to your source control. The `.env` file should already be in your .gitignore.

> [!IMPORTANT]
> **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this.