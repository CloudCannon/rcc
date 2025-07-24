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

4. Add a `.cloudcannon` directory in the root of your project if you don't have one already. Add a `postbuild` file to it, replacing `dist` with the build output directory of your project. If you already have a CloudCannon postbuild file, add this logic to your current one. Add it on your staging branch, so that when you publish your changes to production the postbuild is included.

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
      "rosey": "^2.3.3",
      "dotenv": "^16.4.5",
      "slugify": "^1.6.6",
      "yaml": "^2.4.2",
      "markdown-it": "^13.0.1",
      "unified": "^11.0.5",
      "@inquirer/prompts": "^7.6.0",
      "rehype-remark": "^10.0.1",
      "rehype-parse": "^9.0.1",
      "rehype-stringify": "^10.0.1",
      "remark-stringify": "^11.0.0",
      "rehype-format": "^5.0.1",
      "unist-util-visit": "^5.0.0",
      "smartling-api-sdk-nodejs": "^2.11.0",
    }
    ```

2. Copy the `rosey-connector`, and `rosey-tagger` directories to your project.

3. Run `node rosey-connector/generate.mjs` in the terminal in the root of your directory to generate a config file. If you want you can just skip to the next step and one will be generated for you.

4. Commit and push your changes, and wait for the CloudCannon build to finish. Then pull your changes down to your local. 

    All the files you need to get going will have been generated as part of the CloudCannon build. 

> [!NOTE]
> If you skipped generating a configuration file via the CLI **add at least one language code to the `locales` array** in the `rosey/rcc.yml` file. Remember to replace the placeholder urls if using either of the link features. Once again commit and push, then wait for the CloudCannon build to finish. Then pull your changes down to your local.

5. Add a `translations` collection to your `cloudcannon.config.yml`. If you have the [collection_groups](https://cloudcannon.com/documentation/articles/configure-your-site-navigation/#options) configuration key defined, remember to add `translations` to a collection group, so that it is visible in your sidebar in CloudCannon. 


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

After your next build in CloudCannon, you should see empty translations files. A URL input will be generated for you to translate the page's URL if need be, without anything in your site needing to be tagged. To add text content to translate, start tagging your layouts and components with `data-rosey` tags.

An example tag in [Eleventy](https://www.11ty.dev/) may look like:

```liquid
  <h1 class="heading" data-rosey="{{ heading.heading_text | slugify }}">{{ heading.heading_text }}</h1>
```

Eleventy comes with the `slugify` global filter, which you can use to turn the tagged elements content into an ID friendly slug, and use that as the translation key. If you are using an SSG that doesn't have a `slugify` filter built in - like Astro - you can import a helper function which has been provided in  `rosey-connector/helpers/component-helper.js`.

An example tag in [Astro](https://astro.build/) may look like:

```jsx
  ...
  import { generateRoseyId } from "rosey-connector/helpers/text-formatters.mjs";

  const { heading } = Astro.props;
  ---

  <h1 class="heading" data-rosey={generateRoseyId(heading.heading_text)}>
    {heading.heading_text}
  </h1>
```

### Automatic tagging

Most sites using an SSG will have at least some content that comes from markdown, which gets run through a `markdownify` filter, or somehow turned from markdown to HTML. For example, any body content in a markdown file will go through this process as part of the SSG's build. This markdown content is hard to tag manually.


For this the `rosey-tagger` directory has been provided. In the [Getting Started](#getting-started) steps above, we've added it to the CloudCannon `postbuild` so that it runs after every build, and before the rest of the Rosey workflow. Tag a parent element with the attribute `data-rosey-tagger` and block elements inside of the parent element will be tagged for translation automatically. The most nested block element will be the one to receive the tag, so that there isn't a `data-rosey` tag inside of a `data-rosey` tag.


This is especially useful to use to tag your markdown body content, wherever that lives in your layouts or components, but can be used on any element. For example you could add it to the `<body>` tag of a page for every block level element in that page to be tagged automatically. You shouldn't nest one `data-rosey-tagger` inside of another, however it should respect existing tags you've added manually, and not overwrite them. 


> [!IMPORTANT]
> When using the `rosey-tagger` with markdown, add a Rosey namespace of `data-rosey-ns="rcc-markdown"` on the element containing markdown, so that generated inputs for that content are `type: markdown` in CloudCannon, which will allow editors the same options in the translation input as are allowed for the original content.


If you don't have one of these `data-rosey-tagger` tags on any of your pages it won't do anything, so can be ignored or removed. If no translation is provided for an element, the original will be used. This means even if you tag everything, but don't want to provide a translation for it, the original will be shown in your translated version, rather than a blank space.

## Namespaced pages

Sometimes you don't want a piece of content that appears many times on different pages to be represented on each translation page. Duplicate translation keys (translations with the same ID) across pages *will* be kept in sync with each other, but it can clutter up your translation files. The most common example would be text used in your header and footer content.


For this you can add a `data-rosey-ns` tag similar to the `rcc-markdown` example given in [Automatic tagging](#automatic-tagging) (although `rcc-markdown` is a reserved namespace when using the RCC), and add the value of the tag to the `namespace_page` field in the `rcc.yaml` configuration file. This will cause any translations that are nested under this namespace to appear on a separately generated page, and be ommited from the normal translations for that page. 


By default a `common` namespace page comes with this workflow, although you can configure it to be whatever you wish by adding/editing the values in the `namespace_pages` array in the `rcc.yaml` configuration file. Add a translation to the `common` page by adding `data-rosey-ns="common"` to the element (or a parent of that element) you're adding the tag to.


An example for a header component in Astro might look like:

```jsx
---
import { generateRoseyId } from "rosey-connector/helpers/text-formatters.mjs";

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

## Smartling integration

This project allows for automatic AI-powered translations through Smartling. It uses the [Node.js SDK](https://help.smartling.com/hc/en-us/articles/4405992477979-Node-js-SDK). You must sign up for an account, and enter your Smartling credentials in the rcc configuration file and site's environment variables for this to work.

To add automatic AI-powered translations - which your editors can then QA in CloudCannon - enable Smartling in your `rosey/rcc.yaml` file, by setting `enabled: true` under the Smartling section. Make sure to fill in your `dev_project_id`, and `dev_user_identifier`, with the credentials in your Smartling account. Add your secret API key to your environment variables with the key of `DEV_USER_SECRET` in CloudCannon on your staging site (or your only site if you're not using a publishing workflow). You can set this locally in a `.env` file if you want to test it in your development environment.  

> [!CAUTION]
> Make sure to not push any secret API keys to your source control. Make sure the `.env` file is in your `.gitignore` if you are testing locally.

> [!CAUTION]
> **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this.

### What gets sent to Smartling

A phrase will be sent away to Smartling for automatic translation if, in at least one language:
- there is no translation for the key, and
- we have not received a translation for the key in the past

> [!NOTE]
> If you continue using content for the translation key, as shown in the examples above, and change an original phrase (and don’t change the key yourself), the RCC will detect it's a new phrase because it sees a new key, and it will be sent away to Smartling. If you decide to use a different approach eg. with a fixed key, when the original content changes it won't be sent to Smartling, because the RCC won't detect its a new phrase.


We never archive the Smartling file just in case you disable Smartling, then re-enable it, or remove and then re-add a locale. This helps keep a record of all translations received by Smartling. They're kept in an object, where scaling shouldn’t be a big issue. This helps save money on translations, and avoid the issue where Smartling won't send anything  back if all of the original phrases it’s received have been translated by Smartling before. However, if you disable the Smartling integration and don’t think you’ll ever use it, you can simply delete these files and directories for tidiness if you like.

### Clearing a translation

If you clear a translation, it will be overwritten when the next Smartling call happens - aka when any new phrase is added, and has not been translated by Smartling before. This won’t be a problem if you’ve manually entered a different translation to the input. If you want to use the original untranslated text on the translated page, you cannot rely on the fallback as you could without Smartling, but must enter the original text yourself to avoid it being overwritten.

## A note on JavaScript hydration

The RCC supports any static site (likely an SSG) which Rosey would support. Anything that relies on JS hydration for text values will need workarounds outside of the default workflow. Rosey scans your static HTML for elements with `data-rosey` tags and the text those elements contain. If that text is overwritten by JS the translated text will get clobbered by the untranslated JS values. A couple of workaround ideas:

- Import the locales/*.json file data. Add some logic in your JavaScript to detect which locale you are in via the page's URL. Add more logic to use the translated value from the appropriate locale file if it exists, rather than the original text.

- Hardcode the translated values alongside the original text wherever it is defined in your JS. Then detect whichever locale you are in using the page's url, and use the appropriate values in your JS to hydrate the element with the correct translated text.

- Source the text for your JS via a JSON file. Rosey supports translation of JSON files, so you could detect which locale you are in and ingest whichever JSON file corresponds to that locale. Translation of JSON files is not yet supported in the RCC (see below).

> [!NOTE]
> The RCC does not provide any support for the generation of these JSON files yet, but you can write them as you would using Rosey without the RCC - by hand or with your own middleware. If you would like the RCC to support translation of JSON files, please leave an issue on the repository so we can gauge interest.

## Known issues & workarounds

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

