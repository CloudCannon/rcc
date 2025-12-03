import fs from "fs";
import YAML from "yaml";

export default async function migrateConfig(configPath) {
  console.log("🏗️ Checking if config file is up to date...");
  const configDataBuffer = await fs.promises.readFile(configPath);
  const configData = YAML.parse(configDataBuffer.toString("utf-8"));
  const checkedConfigData = checkForMarkdownKeys(configData);
  return {
    hasMigratedConfig: checkedConfigData.hasMigratedConfig,
    configData: checkedConfigData.configData,
  };
}

function checkForMarkdownKeys(configData) {
  let hasMigratedConfig = false;

  // Migrate to use markdown keys
  if (!configData.markdown_keys) {
    hasMigratedConfig = true;

    console.log("⚠️ No 'markdown_keys' key found in the rcc.yaml config file.");
    console.log("🏗️ Adding key with it's default value and input config...");
    configData.markdown_keys = [
      {
        id: "rcc-markdown",
        enabled_markdown_options: {
          bold: true,
          italic: true,
          strike: true,
          link: true,
          subscript: true,
          superscript: true,
          underline: true,
          code: true,
          undo: true,
          redo: true,
          removeformat: true,
          copyformatting: true,
        },
      },
    ];
    configData._inputs.markdown_keys = {
      type: "array",
      comment:
        "Define namespaces that nominate a translation as requiring a type markdown input. Each markdown key namespace can define which markdown options are enabled.",
      options: {
        structures: "_structures.markdown_key",
      },
    };
    configData._structures = {};
    configData._structures.markdown_key = {};
    configData._structures.markdown_key.values = [
      {
        value: {
          id: "",
          enabled_markdown_options: {
            bold: true,
            italic: true,
            strike: true,
            link: true,
            subscript: true,
            superscript: true,
            underline: true,
            code: true,
            undo: true,
            redo: true,
            removeformat: true,
            copyformatting: true,
          },
        },
        _inputs: {
          id: {
            type: "text",
            comment:
              "The value used for the namespace that nominates a Rosey tag as needing a markdown type input for it's translation.",
          },
          enabled_markdown_options: {
            type: "object",
            options: {
              preview: {
                icon: "list",
              },
            },
          },
          bold: {
            type: "switch",
          },
          italic: {
            type: "switch",
          },
          strike: {
            type: "switch",
          },
          link: {
            type: "switch",
          },
          subscript: {
            type: "switch",
          },
          superscript: {
            type: "switch",
          },
          underline: {
            type: "switch",
          },
          code: {
            type: "switch",
          },
          undo: {
            type: "switch",
          },
          redo: {
            type: "switch",
          },
          removeformat: {
            type: "switch",
          },
          copyformatting: {
            type: "switch",
          },
        },
      },
    ];
  }

  // Migrate to use index_html_pages_only key. It's a boolean so our check has to check that it's undefined or null, not just false.
  if (
    !configData.index_html_pages_only &&
    configData.index_html_pages_only !== false
  ) {
    hasMigratedConfig = true;

    console.log(
      "⚠️ No 'index_html_pages_only' key found in the rcc.yaml config file."
    );

    configData.index_html_pages_only = true;

    configData._inputs.index_html_pages_only = {
      type: "switch",
      comment:
        "If pages are built like /about/index.html, set this to false. If pages are built like /about.html, set this to true.",
    };
  }

  return {
    hasMigratedConfig: hasMigratedConfig,
    configData,
  };
}
