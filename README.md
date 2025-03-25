# Rosey CloudCannon Connector

## Getting started

1. Create two sites using a staging -> production publishing workflow on CloudCannon, if you don't already have one.

2. To your staging site:

    a. Add the env variable `SYNC_PATHS`, with the value `/rosey/`.

    b. If you have a Smartling account set up for automatic translations, add the env variable `DEV_USER_SECRET`. Add your Smartling API key as the value of `DEV_USER_SECRET`.

3. To your production site, add the env variable `ROSEYPROD` with a value of `true`.

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

6. Install the following packages in your project:

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

    11ty has the slugify universal filter, which means we can slugify the content and use that as the translation key. If you are using an SSG that doesn't have the slugify filter built in, you can roll your own. An example has been provided in  `rosey-connector/helpers/component-helper.js`.

    For markdown body content, we need to extend the SSG's built in markdown processing. Plugins are used to tag markdown that is turned into block level html elements, with an html attribute `data-rosey="an-example-phrase-for-translation"`. Content that is processed through the SSGs native markdown processing in templating (eg. Jekylls `markdownify`) will also need the same treatment, where we break the larger (perhaps many paragraph) phrase into individual block level elements. 
    
    In the case of an SSG like Jekyll, where a `markdownify` filter is built in, extending the markdown processing will also affect templating with that filter on it. In the case of an SSG like Astro, we use a component (`rosey-connector/ssgs/astroMarkdownComponent.astro`) with markdown rendering on the content it receives to parse any markdown content we need processed through our templating. This basically accomplishes the same thing as extending the `markdownify` filter in Jekyll - we don't need to tag the whole markdown content, because it's automatically being tagged on all block level elements.


## Jekyll

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
MDX allows you to use components throughout your markdown content, to allow for more complex things than traditional markdown syntax can represent. Bookshop handles the import of all Bookshop components into each file, to allow for any configured [snippets](https://cloudcannon.com/documentation/articles/snippets-using-mdx-components/) to be added to the page. 

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
