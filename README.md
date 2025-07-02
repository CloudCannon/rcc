# Rosey CloudCannon Connector

[Rosey](https://rosey.app/) is used to generate a multilingual site from a set of JSON files. As part of this, Rosey creates a redirect so that the site visitor is redirected to the language set in their browser settings. 

How it works at a high level:

  1. Html elements are tagged by a developer for translation using `data-rosey` tags.

  2. Rosey creates a JSON file called `base.json` from these tags by scanning your built static site.

  3. Rosey takes a different `locales/xx-XX.json` file, which contains the original phrase with a user entered translation and generates the finished translated site.

**What the RCC connector does** is create a way for non-technical editors to create the `locales/xx-XX.json` files needed to generate the site. Using the `base.json` file, YAML files are generated with the correct CloudCannon input configuration to enable translations via an interface in CloudCannon's CMS. These editor-friendly YAML files are then turned into the JSON files needed by Rosey to generate your final multilingual site.

All of this happens in your site's postbuild, meaning it automatically happens each build. The file generation and entry of translations happens on your staging site, while the multilingual site generation takes place on your production (main) site.

## YouTube overview and setup instructions

[![Easily manage your multilingual Astro site in CloudCannon](https://img.youtube.com/vi/u5WittUT3Ts/0.jpg)](https://www.youtube.com/watch?v=u5WittUT3Ts)

## Why is this useful?

An easier-to-understand approach would be to maintain separate copies of each page for each language. This would mean creating a directory for each language, with content pages for each. This is sometimes referred to as split-by-directory. While it can be easier to understand, and debug, it can become tedious to have to replicate any non-text changes across all the separate copies of your languages.

This approach has you maintain one copy of a page. Inputs are generated for all the text content that is tagged for translation, meaning editors can focus on providing just the translations instead of replicating all changes made to a page. You can think of it as separating your content and your layouts - a concept well established in the SSG (and CMS) world. You can change the layout and styling in one place, and have those changes reflected across all the languages you translate to.

## Requirements

- A CloudCannon organisation with access to [publishing workflows](https://cloudcannon.com/documentation/articles/what-is-a-publish-branch/)
- A static site

## Supported SSGs

While the Rosey CloudCannon Connector is mostly agnostic to which SSG you use to generate your static site, the markdown processing for each SSG is slightly different. We need to extend whatever markdown processing the SSG natively uses so that we automatically tag our block-level html body content with `data-rosey` tags, usually using some kind of custom plugin. 

We have provided plugins for, and currently support:

- Astro
- Jekyll
- Eleventy (coming soon)

## Getting started


### CloudCannon setup
Option 1: Staging -> Production workflow

This option is for you if you want to use the default redirect that comes with Rosey, and don't mind your original version being prefixed with a locale code. For example if your original untranslated content is in English, it would be served at `/en/`, like all the other translated locales.

1. Create two sites using a staging -> production publishing workflow on CloudCannon, if you don't already have one.

2. On your staging site:

  a. Add the env variable `SYNC_PATHS`, with the value `/rosey/`.

  b. If you have a Smartling account set up for automatic translations, add the env variable `DEV_USER_SECRET`. Add your Smartling API key as the value of `DEV_USER_SECRET`.

3. On your production site, add the env variable `ROSEYPROD`, with a value of `true`.

4. Add a `.cloudcannon` directory in the root of your project if you don't have one already. Add a `postbuild` file to it, replacing `dist` with the build output directory of your project. If you already have a CloudCannon postbuild file, add this logic to your current one.

  `.cloudcannon/postbuild`

  ```bash
    #!/usr/bin/env bash

    if [[ $ROSEYPROD != "true" ]];
    then
      npx rosey generate --source dist
      node rosey-connector/main.mjs
    fi

    if [[ $ROSEYPROD == "true" ]];
    then
      echo "Translating site with Rosey"
      mv ./dist ./untranslated_site                  
      npx rosey build --source untranslated_site --dest dist 
    fi
  ```

Option 2: Everything happens on one site.

You can use this option if you don't want to use the default redirect that comes with Rosey. Your original content will be served at the root of your url, without a prefix.

1. Create a site on CloudCannon.

2. On your site:

  a. Add the env variable `SYNC_PATHS`, with the value `/rosey/`.

  b. If you have a Smartling account set up for automatic translations, add the env variable `DEV_USER_SECRET`. Add your Smartling API key as the value of `DEV_USER_SECRET`.

3. Add a `.cloudcannon` directory in the root of your project if you don't have one already. Add a `postbuild` file to it, replacing `dist` with the build output directory of your project. If you already have a CloudCannon postbuild file, add this logic to your current one.

  `.cloudcannon/postbuild`

  ```bash
    #!/usr/bin/env bash

    npx rosey generate --source dist
    node rosey-connector/main.mjs

    echo "Translating site with Rosey"
    mv ./dist ./untranslated_site                  
    npx rosey build --source untranslated_site --dest dist --default-language-at-root
  ```

### Rosey setup

1. Install the following packages to your project and run `npm i`.

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
      "smartling-api-sdk-nodejs": "^2.11.0",
    }
    ```

    Extras to install if you are using Astro:

    ```json
      "dependencies": {
        "unist-util-visit": "^5.0.0",
        "hast-util-from-html-isomorphic": "^2.0.0",
      }
    ```

2. Copy the `rosey-connector` directory to your project.

    Commit your changes, and wait for the CloudCannon build to finish. Then pull your changes down to your local. 
    
    
    Alternatively skip waiting for the build by runing the postbuild locally. Run a local build (`npm run build` probably depending on your project). then run the postbuild locally - run `./.cloudcannon/postbuild/` in your terminal at the root of your project. You may need to modify the permissions for this file to allow you to run it locally, as it's not an executable file by default. You can do this by running `chmod +x ./.cloudcannon/postbuild` in your terminal. You will also may need to add `untranslated_site` to your .gitignore, depending on previous steps.


    Either of these options will generate all the files you need to get going. In your generated `rosey/rcc.yml` add at least one language code to the `locales` array,  add your cloudvent url (staging if using the publish workflow) as the value of the `see_on_page_comment.base_url` key, and add your github repo as the value of the `github_history.repo_url` key.


3. Add a `translations` collection to your `cloudcannon.config.yml`. If you have the key `collection_groups:` defined, remember to add `translations` to a collection group, so that it is visible in your sidebar. 


    If your site is nested in a subdirectory you'll need to remove your `source` key, and manually add the subdirectory to each path that needs it. The translations collection's path `rosey` does not need the prefix of the subdirectory since it lives in the root of our project. Schema paths in CloudCannon are not affected by the `source` key, so do not need updating.

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
            - config.yaml
            - 'translations/**'
          _inputs:
            urlTranslation:
              type: text
              comment: Provide a translation for the Url that Rosey will build this page at.
    ```

4. After your next build in CC, you should see nearly empty translations files. A url input will be generated for you to translate the page's url if need be, without anything in your site needing to be tagged. To add text content to translate, start tagging your layouts and components with data-rosey tags.

    An example tag in 11ty may look like: `data-rosey="{{ heading.heading_text | slugify }}"`

    Or in a more complete example:

    ```liquid
      <h1 class="heading" data-rosey="{{ heading.heading_text | slugify }}">{{ heading.heading_text }}</h1>
    ```

    11ty has the slugify global filter, which means you can slugify the content and use that as the translation key. If you are using an SSG that doesn't have a slugify filter built in (like Astro), you can roll your own. One has been provided in  `rosey-connector/helpers/component-helper.js`.

    For markdown body content, you need to extend the SSG's built in markdown processing. Plugins are used to tag markdown that is turned into block level html elements, with an html attribute `data-rosey="an-example-phrase-for-translation"`. Content that is processed through the SSGs native markdown processing in templating (eg. Jekylls `markdownify`) will also need the same treatment, where the larger (perhaps many paragraph) phrase is broken into individual block level elements. 
    
    In the case of an SSG like Jekyll, where a `markdownify` filter is built in, extending the markdown processing will also affect templating with that filter on it. In the case of an SSG like Astro a component (`rosey-connector/ssgs/astroMarkdownComponent.astro`), with markdown rendering on the content it receives, is used to parse any markdown content that needs processed through your templating. This accomplishes the same thing as extending the `markdownify` filter in Jekyll - it removes the need to tag the whole piece of markdown content as one phrase, because it's automatically being tagged on all block level elements.

5. To add automatic AI-powered translations - which your editors can then QA in the app - enable Smartling in your `rosey/config.yaml` file, by setting `smartling_enabled: true`. Make sure to fill in your `dev_project_id`, and `dev_user_identifier`, with the credentials in your Smartling account. Ensure you have added you secret API key to your environment variables in CloudCannon, as `DEV_USER_SECRET`. You can set this locally in a `.env` file if you want to test it in your development environment. 

> [!IMPORTANT]
> Make sure to not push any secret API keys to your source control. The `.env` file should already be in your .gitignore.

> [!IMPORTANT]
> **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this. 
