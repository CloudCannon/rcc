# Rosey CloudCannon Connector

Read [this blog post](https://cloudcannon.com/blog/managing-multilingual-content-in-cloudcannon/) before getting starting with the RCC.


[Rosey](https://rosey.app/) is used to generate a multilingual site from a set of JSON files. As part of this, Rosey creates a redirect so that the site visitor is redirected to the language set in their browser settings. 

How Rosey works at a high level:

  1. Html elements are tagged by a developer for translation using `data-rosey` tags.

  2. Rosey creates a JSON file called `base.json` from these tags by scanning your built static site.

  3. Rosey takes a different `locales/xx-XX.json` file, which contains the original phrase with a user entered translation and generates the finished translated site.

**What the RCC does** is create a way for non-technical editors to create the `locales/xx-XX.json` files needed to generate the site. Using the `base.json` file, YAML files are generated with the correct CloudCannon input configuration to enable translations via an interface in CloudCannon's CMS. These editor-friendly YAML files are then turned into the JSON files needed by Rosey to generate your final multilingual site.

All of this happens in your site's postbuild, meaning it automatically happens each build. The file generation and entry of translations happens on your staging site, while the multilingual site generation takes place on your production (main) site.

## Getting started

### CloudCannon setup

#### Option 1: Staging -> Production workflow

This option is for you if you want to use the default redirect that comes with Rosey, and don't mind your original version being prefixed with a locale code. For example if your original untranslated content is in English, it would be served at `/en/`, like all the other translated locales.

1. Create two sites using a staging -> production [publishing workflow](https://cloudcannon.com/documentation/articles/what-is-a-publish-branch/) on CloudCannon, if you don't already have one.

2. On your staging site add the env variable `SYNC_PATHS`, with the value `/rosey/`.


3. On your production site add the env variable `ROSEYPROD`, with a value of `true`.

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
      node rosey-tagger/main.mjs --source dist # Add the flag --verbose for more logs
      echo "Translating site with Rosey"
      mv ./dist ./untranslated_site                  
      npx rosey build --source untranslated_site --dest dist 
    fi
  ```

#### Option 2: Everything happens on one site

You can use this option if you don't want to use the default redirect that comes with Rosey. Your original content will be served at the root of your url, without a prefix.

1. Create a site on CloudCannon.

2. Add the env variable `SYNC_PATHS`, with the value `/rosey/`.

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
      "rehype-format": "^5.0.1",
      "unist-util-visit": "^5.0.0",
      "smartling-api-sdk-nodejs": "^2.11.0",
    }
    ```

2. Copy the `rosey-connector`, and `rosey-tagger` directories to your project. Commit your changes, and wait for the CloudCannon build to finish. Then pull your changes down to your local. 


    All the files you need will be generated  to get going. In your generated `rosey/rcc.yml` **add at least one language code to the `locales` array**,  add your cloudvent url (staging if using the publish workflow) as the value of the `see_on_page_comment.base_url` key, and add your github repo as the value of the `github_history.repo_url` key.


    Once again wait for the CloudCannon build to finish. Then pull your changes down to your local.

3. Add a `translations` collection to your `cloudcannon.config.yml`. If you have the key `collection_groups:` defined, remember to add `translations` to a collection group, so that it is visible in your sidebar. 


    If your site is nested in a subdirectory you'll need to remove your `source` key, and manually add the subdirectory to each path that needs it (probably just your collections). The translations collection's path `rosey` does not need the prefix of the subdirectory since it lives in the root of our project. Schema paths in CloudCannon are not affected by the `source` key, so do not need updating.

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

## Tagging content for translation

### Manual tagging

After your next build in CC, you should see nearly empty translations files. A url input will be generated for you to translate the page's url if need be, without anything in your site needing to be tagged. To add text content to translate, start tagging your layouts and components with data-rosey tags.

An example tag in 11ty may look like:

```liquid
  <h1 class="heading" data-rosey="{{ heading.heading_text | slugify }}">{{ heading.heading_text }}</h1>
```

11ty has the slugify global filter, which means you can slugify the content and use that as the translation key. If you are using an SSG that doesn't have a slugify filter built in -like Astro - you can import a helper function which has been provided in  `rosey-connector/helpers/component-helper.js`.

### Automatic tagging

Most sites using an SSG will have at least some content that comes from markdown, and gets run through a `markdownify` filter, or somehow turned from markdown to html. Any body content in a markdown file will go through this process. This makes it hard to tag manually.


For this the `rosey-tagger` directory has been provided. In the Getting Started steps above, we've added it to the postbuild so that it runs after every build, but before the rest of the Rosey ecosystem. Tag a parent element with the attribute `data-rosey-tagger="true"` and block elements inside of the parent element will be tagged for translation automatically. The most nested block element will be the one to receive the tag, so that there isn't a `data-rosey` tag inside of a `data-rosey` tag.


This is especially useful to wrap wherever your markdown body content goes in your layouts or components, but can be used on element. For example you could add it to the <body> tag of a page for every block level element in that page to be tagged automatically. 


If you don't have one of these `data-rosey-tagger="true"` tags on a page it won't do anything, so can be ignored or removed. If no translation is provided for an element, the original will be used. This means even if you tag everything but don't want to provide a translation for it - nothing bad should happen to the element in your translated version.

## Smartling integration

To add automatic AI-powered translations - which your editors can then QA in the app - enable Smartling in your `rosey/config.yaml` file, by setting `smartling_enabled: true`. Make sure to fill in your `dev_project_id`, and `dev_user_identifier`, with the credentials in your Smartling account. Add you secret API key to your environment variables as `DEV_USER_SECRET` in CloudCannon on your staging site (or your only site if you're not using a publishing workflow). You can set this locally in a `.env` file if you want to test it in your development environment. 

> [!IMPORTANT]
> Make sure to not push any secret API keys to your source control. The `.env` file should already be in your .gitignore.

> [!IMPORTANT]
> **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this. 
