# Rosey CloudCannon Connector

[Rosey](https://rosey.app/) is used to generate a multilingual site from a set of JSON files, complete with a redirect to the site visitor's language set in their browser settings. 

To generate the multilingual site:

  1. Html elements are tagged by a developer for translation using `data-rosey` tags.

  2. Rosey creates a JSON file called `base.json` from these tags by scanning your built static site.

  3. Rosey takes a different `locales/xx-XX.json` file, which contains the original phrase with a user entered translation and generates the finished translated site.

**What the RCC connector does** is create a way for non-technical editors to create the `locales/xx-XX.json` files needed to generate the site. Using the base.json file, YAML files are generated with the correct CloudCannon input configuration to enable translations via an interface in CloudCannon's CMS. These editor-friendly YAML files are then turned into the JSON files needed by Rosey to generate your final multilingual site.

All of this happens in your site's postbuild, meaning it automatically happens each build. The file generation and entry of translations happens on your staging site, while the multilingual site generation takes place on your production (main) site.

## YouTube overview and setup instructions

[![Easily manage your multilingual Astro site in CloudCannon](https://img.youtube.com/vi/u5WittUT3Ts/0.jpg)](https://www.youtube.com/watch?v=u5WittUT3Ts)

## Why is this useful?

A traditional easier-to-understand approach would be to maintain separate copies of each page for each language. This would mean creating a directory for each language, with content pages for each. This is sometimes referred to as split-by-directory. While it is easy to understand, and debug, it can become tedious to have to replicate any non-text changes across all the separate copies of your languages.

This approach has you maintain one copy of a page. Inputs are generated for all the text content that is tagged for translation, meaning editors can focus on providing just the translations instead of replicating all changes made to a page. You can think of it as separating your content and your layouts - a concept well established in the SSG (and CMS) world. You can change the layout and styling in one place, and have those changes reflected across all the languages you translate to.

## Requirements

- A CloudCannon organisation with access to [publishing workflows](https://cloudcannon.com/documentation/articles/what-is-a-publish-branch/)
- A static site

## Supported SSGs

While the Rosey CloudCannon Connector is mostly agnostic to which SSG you use, the markdown processing for each SSG is slightly different. We need to extend this markdown processing so that we automatically tag our block-level html body content with `data-rosey` tags, usually using some kind of custom plugin. 

We have provided plugins for, and currently support:

- Astro
- Jekyll
- Eleventy (coming soon)

## Getting started

1. Create two sites using a staging -> production publishing workflow on CloudCannon, if you don't already have one.

2. On your staging site:

    a. Add the env variable `SYNC_PATHS`, with the value `/rosey/`.

    b. If you have a Smartling account set up for automatic translations, add the env variable `DEV_USER_SECRET`. Add your Smartling API key as the value of `DEV_USER_SECRET`.

3. On your production site, add the env variable `ROSEYPROD`, with a value of `true`.

4. Copy the `rosey` and `rosey-connector` directories to your project. In your `rosey/config.yml` add at least one language code to the `locales` array, and add your staging cloudvent url to the `base_url` key.

5. Add a `.cloudcannon` directory in the root of your project if you don't have one already. Add a `postbuild` file to it, replacing `dist` with the output directory of your project. Taking a default 11ty build as an example; you would replace `dist` with `_site`. If you already have a CloudCannon postbuild file, add this logic to your current one.

    `.cloudcannon/postbuild`:


    ```bash
    #!/usr/bin/env bash

    npx @bookshop/generate

    if [[ $ROSEYPROD != "true" ]];
    then
      npx rosey generate --source dist
      node rosey-connector/roseyCloudCannonConnector.js
    fi

    if [[ $ROSEYPROD == "true" ]];
    then
      echo "Translating site with Rosey"
      # By default, Rosey will place the default language under a language code, e.g. /en/index.html, and will generate a redirect file at /index.html.
      # By setting the flag --default-language-at-root, Rosey will output the default language at the root path, e.g. /index.html.
      # By setting the flag --default-language-at-root, Rosey will not generate any redirect pages.

      # We only want this to run on our production site, as it can interfere with CloudCannon CMS's visual editor
      # There's a little bit of shuffling around here to ensure the translated site ends up where CloudCannon picks up your site
      mv ./dist ./untranslated_site                  
      npx rosey build --source untranslated_site --dest dist 
    fi

    ```

6. Install the following packages to your project:

    `package.json`:

    ``` json
    "dependencies": {
      "markdown-it": "^13.0.1",
      "node-html-markdown": "^1.3.0",
      "rosey": "^2.3.3",
      "slugify": "^1.6.6",
      "yaml": "^2.4.2",
      "smartling-api-sdk-nodejs": "^2.11.0",
      "dotenv": "^16.4.5",
    }
    ```

    Extras if you are using Astro:

    ```json
      "dependencies": {
        "unist-util-visit": "^5.0.0",
        "hast-util-from-html-isomorphic": "^2.0.0",
      }
    ```

7. Add a `translations` collection to your `cloudcannon.config.yml`. If you have the key `collection_groups:` defined, remember to add `translations` to a collection group, so that it is visible in your sidebar. 

    If your site is nested in a subdirectory you'll need to remove your `source` key, and manually add the subdirectory to each path that needs it. The translations collection's path `rosey` does not need the prefix of the subdirectory since it lives in the root. Schema paths in CloudCannon are not affected by the `source` key, so do not need updating.

    `cloudcannon.config.yml`:

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
            comment: Provide a translation for the URL that Rosey will build this page at.

    ```

8. This project is written in ESM syntax. If your project is in CJS, you may need to update your project, or the    `rosey-connector` files. 

    To change your project to ESM, make sure your package.json is `"type": "module"`, and either change any CJS files to .cjs extension, or refactor to ESM syntax. 

    Alternatively it may be easier to change the .js files in `rosey-connector` to .mjs, and update any .js imports in those files.

9. After your next build in CC, You should see empty translations files. Start tagging your layouts and components with data-rosey tags to see something appear in here to translate.

    An example tag in 11ty may look like:
    data-rosey="{{ heading.heading_text | slugify }}"

    ```liquid
    <h1 class="heading" data-rosey="{{ heading.heading_text | slugify }}">{{ heading.heading_text }}</h1>
    ```

    11ty has the slugify universal filter, which means you can slugify the content and use that as the translation key. If you are using an SSG that doesn't have the slugify filter built in, you can roll your own. One has been provided in  `rosey-connector/helpers/component-helper.js`.

    For markdown body content, you need to extend the SSG's built in markdown processing. Plugins are used to tag markdown that is turned into block level html elements, with an html attribute `data-rosey="an-example-phrase-for-translation"`. Content that is processed through the SSGs native markdown processing in templating (eg. Jekylls `markdownify`) will also need the same treatment, where the larger (perhaps many paragraph) phrase is broken into individual block level elements. 
    
    In the case of an SSG like Jekyll, where a `markdownify` filter is built in, extending the markdown processing will also affect templating with that filter on it. In the case of an SSG like Astro, a component (`rosey-connector/ssgs/astroMarkdownComponent.astro`) with markdown rendering on the content it receives is used to parse any markdown content that needs processed through your templating. This basically accomplishes the same thing as extending the `markdownify` filter in Jekyll - it removes the need to tag the whole piece of markdown content as one phrase, because it's automatically being tagged on all block level elements.

10. To add automatic AI-powered translations - which your editors can then QA - enable Smartling in your `rosey/config.yaml` file, by setting `smartling_enabled: true`. Make sure to fill in your `dev_project_id`, and `dev_user_identifier`, with the credentials in your Smartling account. Ensure you have added you secret API key to your environment variables in CloudCannon, as `DEV_USER_SECRET`. You can set this locally in a `.env` file if you want to test it in your development environment. 

> [!IMPORTANT]
> Make sure to not push any secret API keys to your source control. The `.env` file should already be in your .gitignore.

> [!IMPORTANT]
> **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this. 

## Jekyll
See a demonstration of this workflow [here](https://github.com/CloudCannon/rosey-jekyll-starter).

### Generating ids

When tagging content for translation, the slugified contents of that translation should be used as the `data-rosey` id.

An example in Jekyll:

```liquid
<h1 class="{{c}}__title" data-rosey="{{ include.title | slugify }}">{{ include.title }}</h1>
```

The built in `slugify` filter makes it easy to slugify the text contents for use as the `data-rosey` tag. Templating with the `markdownify` filter does not need tagged like this, as it will automatically be tagged with plugins.

### Markdown processing

Create a prebuild in your `.cloudcannon` folder.

``` bash
#!/usr/bin/env bash

echo "Moving jekyllMarkdownPlugin.rb to _plugins"
mv rosey-connector/ssgs/jekyllMarkdownPlugin.rb site/_plugins/jekyllMarkdownPlugin.rb
echo "Moved jekyllMarkdownPlugin.rb to _plugins!"
echo "Moving jekyllImagePlugin.rb to _plugins"
mv rosey-connector/ssgs/jekyllImagePlugin.rb site/_plugins/jekyllImagePlugin.rb
echo "Moved jekyllImagePlugin.rb to _plugins!"
```

This prebuild moves two plugins two our sites `_plugins` folder. Both plugins customise the markdown processing of Jekyll; by extending how Jekyll uses Kramdown to parse the markdown. This affects page body content, and templating with the `markdownify` filter. This means neither body content, nor templating with the `markdownify` filter need to be tagged manually.

`jekyllMarkdownPlugin.rb` tags all block level elements with `data-rosey` tags. It uses the slugified text contents of the element for the value.

`jekyllImagePlugin.rb` removes the wrapping paragraph element from an image. This is important so that we don't have image links mistakenly appear in our translations.

### Build directory
Change your postbuild to use `_site` instead of `dist`.

```bash
#!/usr/bin/env bash
npx @bookshop/generate

if [[ $ROSEYPROD != "true" ]];
then
  npx rosey generate --source _site
  node rosey-connector/roseyCloudCannonConnector.js
fi

if [[ $ROSEYPROD == "true" ]];
then
  echo "Translating site with Rosey"
  # By default, Rosey will place the default language under a language code, e.g. /en/index.html, and will generate a redirect file at /index.html.
  # By setting the flag --default-language-at-root, Rosey will output the default language at the root path, e.g. /index.html.
  # By setting the flag --default-language-at-root, Rosey will not generate any redirect pages.

  # We only want this to run on our production site, as it can interfere with CloudCannon CMS's visual editor
  # There's a little bit of shuffling around here to ensure the translated site ends up where CloudCannon picks up your site
  mv ./_site ./untranslated_site                  
  npx rosey build --source untranslated_site --dest _site 
fi
```

## Astro
See a demonstration of this workflow [here](https://github.com/CloudCannon/rosey-astro-starter).

### Extra dependencies

To use the provided markdown plugin, and markdown component for Astro, these extra dependencies need to be installed:

```json
  "dependencies": {
    "unist-util-visit": "^5.0.0",
    "hast-util-from-html-isomorphic": "^2.0.0",
  }
```

### Config file
Your `astro.config.mjs` should have the following configuration, or add this to yours.

```javascript
import mdx from "@astrojs/mdx";
import { autoAddRoseyTags } from "./rosey-connector/ssgs/astroMarkdownTaggerPlugin.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://adjective-noun.cloudvent.net/", // Replace this with your own
  integrations: [bookshop(), mdx()],
  markdown: {
    rehypePlugins: [autoAddRoseyTags],
    remarkRehype: {
      // https://github.com/syntax-tree/mdast-util-to-hast?tab=readme-ov-file#options
      handlers: {
        mdxJsxTextElement(state, node) {
          return {
            type: "element",
            tagName: node.name,
            properties: {},
            children: state.all(node),
          };
        },
      },
    },
  },
});
```

MDX allows you to use components throughout your markdown content, to allow for more complex things than traditional markdown syntax could represent. Bookshop handles the import of any Bookshop components into each file, to allow for any [snippets](https://cloudcannon.com/documentation/articles/snippets-using-mdx-components/) to be added to the page. CloudCannon configuration then defines which snippets an editor can see and their editing experience for editing, or adding them to the page.

A rehype plugin has been provided to automatically tag block level markdown elements for translation. A handler has been added so that our plugin's AST parser knows what to do with any JSX elements it comes across in our mdx content.

### Markdown processing
The `./rosey-connector/ssgs/astroMarkdownTaggerPlugin.ts` plugin is used to extend Astro's parsing of markdown content into HTML. As the name suggests, it tags block level content in your markdown. This means you don't need to manually tag any content that will be processed as part of your page's body content - it should happen as part of the build. 

### Markdown Component
Sometimes a component needs to contain markdown content. A `type: markdown` input in CloudCannon will allow an editor to add markdown as a component's content. 

Some SSGs come with a `markdownify` filter out of the box that processes content from markdown to html. In such an SSG we would simply add this filter to the templating our component. In Astro, we need to roll our own with one of the many markdown processing libraries out there. A component has been provided `rosey-connector/ssgs/astroMarkdownComponent.astro` to add wherever you need to parse markdown that isn't going to be automatically parsed by Astro. 

Drag it into your project's components folder, and update the import `import { generateRoseyMarkdownID } from "../helpers/component-helper";` to reflect it's new relative address. It can then be used throughout your components and layouts like:
  
  ```jsx
  <div class="mb-4" style={`color: ${block.text.color};`}>
    <Markdown content={block.text.markdown_content} />
  </div>
  ```

You can style the content like:

  ```css
  .markdown-text h1 {
    font-size: 3rem;
    line-height: 3rem;
  }
  .markdown-text h2 {
    font-size: 2.5rem;
    line-height: 2.5rem;
  }
  ```

### Generating ids

When tagging content for translation, the slugified contents of that translation should be used as the `data-rosey` id.

A helper function has been provided. Add this to the top of your component, or layout, adjusting the import address as needed.

  ```js
  import { generateRoseyId } from "../../../rosey-connector/helpers/component-helper.js";
  ```

Add it to your html templating like:

  ```jsx
  <h1
    class="heading"
    data-rosey={generateRoseyId(block.heading.heading_text)}>
    {block.heading.heading_text}
  </h1>
  ```

## Maintenance

### Adding the rosey-connector directory to downstream repositories

To add a single folder as an upstream dependency, we can use a git subtree.

[Using this as a guide:](https://gist.github.com/tswaters/542ba147a07904b1f3f5)

#### Initial setup

Initial setup of fetching the `rosey-connector` directory from https://github.com/CloudCannon/rcc, for use in a downstream repository. This allows us to maintain the RCC logic in one place.

```bash
# Add remote to upstream repo, create new tracking branch, fetch immediately 
# An alias may need to be set if using multiple SSH keys
git remote add -f rcc-upstream git@github.com:CloudCannon/rcc.git
git checkout -b upstream/rcc rcc-upstream/main

# Split off subdir of tracking branch into separate branch
git subtree split -q --squash --prefix=rosey-connector --annotate="[rcc] " --rejoin -b merging/rcc

# Add the split subdir on separate branch as a subdirectory on staging
git checkout staging
git subtree add --prefix=rosey-connector --squash merging/rcc
```

#### Pulling from upstream

Pulling changes to the `rosey-connector` directory from https://github.com/CloudCannon/rcc.

```bash
# switch back to tracking branch, fetch & rebase.
git checkout upstream/rcc 
git pull rcc-upstream/main

# update the separate branch with changes from upstream
git subtree split -q --prefix=rosey-connector --annotate="[rcc] " --rejoin -b merging/rcc

# switch back to staging and use subtree merge to update the subdirectory
git checkout staging
git subtree merge -q --prefix=rosey-connector --squash merging/rcc
```
