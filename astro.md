
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
The `./rosey-connector/ssgs/astroMarkdownTaggerPlugin.ts` plugin is used to extend Astro's parsing of markdown content into Html. As the name suggests, it tags block level content in your markdown. This means you don't need to manually tag any content that will be processed as part of your page's body content - it should happen as part of the build. 

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
