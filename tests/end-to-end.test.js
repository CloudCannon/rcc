import fs from "fs";
import YAML from "yaml";
import { generate } from "../rosey-connector/main.mjs";
import { execSync } from "child_process";
import { fileExists, isDirectory, readFile, readJSON, readYaml } from "./utils";

const testBuildDir = "_site";

describe("Run `rosey-cloudcannon-connector generate`", () => {
  // Setup
  beforeAll(async () => {
    // Remove last rounds tests
    await fs.promises.rm("./rosey", { recursive: true, force: true });

    // Simulate running a postbuild
    execSync(`npx rosey generate --source ${testBuildDir}`); // Only need to run this once at the start (base.json doesn't change)
    await generate();
    return;
  });

  describe("The config file is generated if none exists", () => {
    test("A config file is generated", async () => {
      const configFileExists = await fileExists("./rosey/rcc.yaml");
      expect(configFileExists).toBe(true);
    });
    test("A config file has the correct top level keys", async () => {
      const configFileData = await readYaml("./rosey/rcc.yaml");
      expect(configFileData).toHaveProperty("locales");
      expect(configFileData).toHaveProperty("input_lengths");
      expect(configFileData).toHaveProperty("markdown_keys");
      expect(configFileData).toHaveProperty("see_on_page_comment");
      expect(configFileData).toHaveProperty("git_history_link");
      expect(configFileData).toHaveProperty("namespace_pages");
      expect(configFileData).toHaveProperty("rosey_paths");
      expect(configFileData).toHaveProperty("smartling");
      expect(configFileData).toHaveProperty("_inputs");
    });
  });

  describe("Add RCC to a site containing Rosey ids, and a config file containing a locale", () => {
    const translationKey = "a-rosey-id-with-no-translation";
    const translationOriginalPhrase = "This piece of text has no translation.";
    const translationFilePath = "./rosey/translations/fr-FR/home.yaml";
    const localeFilePath = "./rosey/locales/fr-FR.json";

    let localeData;
    let translationData;

    // Write a locale to the generated config and run generate() again
    beforeAll(async () => {
      const configData = await readYaml("./rosey/rcc.yaml");

      configData.locales.push("fr-FR");
      configData.markdown_keys.push({
        id: "second-markdown-key",
        enabled_markdown_options: {
          bold: false,
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
      });

      await fs.promises.writeFile(
        "./rosey/rcc.yaml",
        YAML.stringify(configData)
      );
      await generate();

      localeData = await readJSON(localeFilePath);
      translationData = await readYaml(translationFilePath);
      return;
    });

    test("A translations directory is created", async () => {
      const isTranslationsDirectory = await isDirectory("./rosey/translations");
      expect(isTranslationsDirectory).toBe(true);
    });

    test("A translations file is created", async () => {
      const translationFileExists = await fileExists(translationFilePath);
      expect(translationFileExists).toBe(true);
    });

    test("Freshly generated translation files contain urlTranslation key", async () => {
      expect(translationData).toHaveProperty("urlTranslation");
    });

    test("Freshly generated translation files contain an empty Rosey id key", async () => {
      expect(translationData).toHaveProperty(translationKey);
      expect(translationData[translationKey]).toBe("");
    });

    test("Freshly generated translation files contain input config", async () => {
      expect(translationData).toHaveProperty("_inputs");
      expect(Object.keys(translationData["_inputs"]).length).toBeGreaterThan(0);
    });

    test("Input 'See on page' comments are formatted correctly", async () => {
      const formattedComment =
        "[See in context](https://adjective-noun.cloudvent.net/index.html#:~:text=This%20piece%20of%20text%20has%20no%20translation.)";
      expect(translationData._inputs[translationKey].comment).toBe(
        formattedComment
      );
    });

    test("Markdown options are added to a keys input config if containing a markdown namespace", async () => {
      const markdownOptionsPath =
        translationData._inputs[
          "rcc-markdown:a-nested-list-item-with-markdown-options"
        ].options;
      expect(markdownOptionsPath.bold).toBe(true);
      expect(markdownOptionsPath.italic).toBe(true);
      expect(markdownOptionsPath.strike).toBe(true);
      expect(markdownOptionsPath.link).toBe(true);
      expect(markdownOptionsPath.subscript).toBe(true);
      expect(markdownOptionsPath.superscript).toBe(true);
      expect(markdownOptionsPath.underline).toBe(true);
      expect(markdownOptionsPath.code).toBe(true);
      expect(markdownOptionsPath.undo).toBe(true);
      expect(markdownOptionsPath.redo).toBe(true);
      expect(markdownOptionsPath.removeformat).toBe(true);
      expect(markdownOptionsPath.copyformatting).toBe(true);
    });

    test("Different markdown options are added to keys with markdown_key namespaces", async () => {
      const markdownOptionsPath =
        translationData._inputs[
          "second-markdown-key:a-different-nested-list-item-with-markdown-options"
        ].options;
      expect(markdownOptionsPath.bold).toBe(false);
      expect(markdownOptionsPath.italic).toBe(true);
      expect(markdownOptionsPath.strike).toBe(true);
      expect(markdownOptionsPath.link).toBe(true);
      expect(markdownOptionsPath.subscript).toBe(true);
      expect(markdownOptionsPath.superscript).toBe(true);
      expect(markdownOptionsPath.underline).toBe(true);
      expect(markdownOptionsPath.code).toBe(true);
      expect(markdownOptionsPath.undo).toBe(true);
      expect(markdownOptionsPath.redo).toBe(true);
      expect(markdownOptionsPath.removeformat).toBe(true);
      expect(markdownOptionsPath.copyformatting).toBe(true);
    });

    test("A namespaced page is not created if one is configured but there are no translations using it", async () => {
      const defaultNamespacePageExists = await fileExists(
        "./rosey/translations/fr-FR/common.yaml"
      );
      expect(defaultNamespacePageExists).toBe(false);
    });

    test("A locales directory is created", async () => {
      const localeDirectoryExists = await isDirectory("./rosey/locales");
      expect(localeDirectoryExists).toBe(true);
    });

    test("A locales JSON file is created", async () => {
      const localeFileExists = await fileExists(localeFilePath);
      expect(localeFileExists).toBe(true);
    });

    test("A Rosey id is added to the locales file", async () => {
      expect(localeData).toHaveProperty(translationKey);
    });

    test("A Rosey id with no translation falls back to use the original for it's value", async () => {
      expect(localeData[translationKey].value.trim()).toBe(
        translationOriginalPhrase
      );
    });
  });

  describe("Run the RCC on a site containing existing translations", () => {
    const translationPageWithTranslation =
      "./rosey/translations/fr-FR/home.yaml";
    const existingTranslationKey = "a-rosey-id-with-a-translation-to-preserve";
    const existingTranslationPhrase = "An existing translation to preserve.";

    // TODO: Add ids using a namespace like common to the base.json (or the test files themselves)

    let localeData;
    let translationData;

    // Add some translations files containing translations before we run generate again
    beforeAll(async () => {
      // Create an existing translation file that contains translations
      const existingTranslationPageData = await readYaml(
        translationPageWithTranslation
      );

      existingTranslationPageData[existingTranslationKey] =
        existingTranslationPhrase;

      await fs.promises.writeFile(
        translationPageWithTranslation,
        YAML.stringify(existingTranslationPageData)
      );
      // Simulate running a postbuild
      await generate();

      localeData = await readJSON("./rosey/locales/fr-FR.json");
      translationData = await readYaml(translationPageWithTranslation);

      return;
    });

    test("An existing translation is preserved", async () => {
      expect(translationData[existingTranslationKey].trim()).toBe(
        existingTranslationPhrase
      );
    });

    test("An existing translation makes it to locales", async () => {
      expect(localeData[existingTranslationKey].value.trim()).toBe(
        existingTranslationPhrase
      );
    });

    // test("Ids without a translation fallback to the original when added to the locale file", async () => {
    //   // TODO:
    // });

    // test("Ids with a translation are added to the locale file", async () => {
    //   // TODO:
    // });

    // test("An input of type: text is created", async () => {
    //   // TODO:
    // });

    // test("An input of type: textarea is created", async () => {
    //   // TODO:
    // });

    // test("An input of type: markdown is created", async () => {
    //   // TODO:
    // });

    // test("A translation with a long original text has a context field in its input config and label concat", async () => {
    //   // TODO:
    // });

    // test("An input has a correctly formatted `See on page` link if configured", async () => {
    //   // TODO:
    // });

    // test("An input does not have a `See on page` link if not enabled", async () => {
    //   // TODO:
    // });

    // test("The page has a git repository link if configured", async () => {
    //   // TODO:
    // });

    // test("The page does not have a git repository link if not enabled", async () => {
    //   // TODO:
    // });

    // test("A namespace page is created if a Rosey id containing a configured namespace_page id is detected", async () => {
    //   // TODO:
    // });

    // test("More than one namespace page is created if configured, and Rosey ids containing the namespace_pages are detected", async () => {
    //   // TODO:
    // });

    // test("Ids with namespaces are correctly assigned as markdown with the correct options that are in the config file `markdown_keys`", async () => {
    //   // TODO:
    // });

    // test("Ids with namespaces are correctly assigned as belonging to a namespaced page, even amongst arbitrary namespaces like `footer:`", async () => {
    //   // TODO:
    // });

    // test("Translations are correctly grouped into 'Still to translated', or 'Translated' in the page root obj input config", async () => {
    //   // TODO:
    // });

    // test("Translation files are archived if their page is removed", async () => {
    //   // TODO:
    // });

    // test("Clearing a translation updates duplicates with translations that used to exist", async () => {
    //   // - To be empty
    //   // - And fallback to the original in the locales file
    //   // TODO:
    // });

    // test("- Log data updates correctly when a translation is added (with duplicates on other pages", async () => {
    //   // TODO:
    // });

    // test("- Log data updates correctly when a translation is removed (with duplicates on other pages)", async () => {
    //   // TODO:
    // });
  });
});
