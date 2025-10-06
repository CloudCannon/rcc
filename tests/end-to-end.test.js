import fs from "fs";
import YAML from "yaml";
import { generate } from "../rosey-connector/main.mjs";
import { execSync } from "child_process";
import { fileExists, isDirectory, readFile, readJson, readYaml } from "./utils";

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

  const translationFilePath = "./rosey/translations/fr-FR/home.yaml";
  const localeFilePath = "./rosey/locales/fr-FR.json";
  const configFilePath = "./rosey/rcc.yaml";
  const baseJsonPath = "./rosey/base.json";
  const baseUrlJsonPath = "./rosey/base.urls.json";

  const textRoseyId = "a-simple-text-input";
  const noTranslationRoseyId = "a-rosey-id-with-no-translation";
  const longPhraseRoseyId =
    "A-long-piece-of-text-that-should-be-a-textarea-not-just-a-simple-text-input%2E-Some-extra-words-for-length%2E";
  const markdownRoseyId =
    "rcc-markdown:a-nested-list-item-with-markdown-options";

  const defaultNamespacePagePath = "./rosey/translations/fr-FR/common.yaml";
  const unusedNamespacePage = "an-unused-namespace-page";
  const customNamespacePage = "header";

  describe("The config file is generated if none exists", () => {
    test("A config file is generated", async () => {
      const configFileExists = await fileExists(configFilePath);
      expect(configFileExists).toBe(true);
    });
    test("A config file has the correct top level keys", async () => {
      const configFileData = await readYaml(configFilePath);
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

  describe("Add RCC to a site containing Rosey ids, and a config file with values set", () => {
    let localeData;
    let translationData;

    // Write a locale to the generated config and run generate() again
    beforeAll(async () => {
      const configData = await readYaml(configFilePath);

      configData.locales.push("fr-FR");
      configData.namespace_pages.push(unusedNamespacePage);
      configData.namespace_pages.push(customNamespacePage);
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
      configData.git_history_link.enabled = true;

      await fs.promises.writeFile(configFilePath, YAML.stringify(configData));
      await generate();

      localeData = await readJson(localeFilePath);
      translationData = await readYaml(translationFilePath);
      return;
    });

    describe("The generation of translation files", () => {
      test("A translations directory is created", async () => {
        const isTranslationsDirectory = await isDirectory(
          "./rosey/translations"
        );
        expect(isTranslationsDirectory).toBe(true);
      });

      test("A translations file is created", async () => {
        const translationFileExists = await fileExists(translationFilePath);
        expect(translationFileExists).toBe(true);
      });

      test("No translation file is created if a content page exists for it, but there are no translations belong to it", async () => {
        const translationFileExists = await fileExists(
          "./rosey/translations/fr-FR/a-dir/a-page-with-no-translations.yaml"
        );
        expect(translationFileExists).toBe(false);
      });

      test("A namespace page is not created if one is configured but there are no translations using it", async () => {
        const unusedNamespacePageExists = await fileExists(
          `./rosey/translations/fr-FR/${unusedNamespacePage}.yaml`
        );
        expect(unusedNamespacePageExists).toBe(false);
      });

      test("A namespace page is created if a Rosey id containing a configured namespace_page id is detected", async () => {
        const customNamespacePageExists = await fileExists(
          `./rosey/translations/fr-FR/${customNamespacePage}.yaml`
        );
        expect(customNamespacePageExists).toBe(true);
      });

      test("More than one namespace page is created if configured, and Rosey ids containing the namespace pages are detected", async () => {
        const customNamespacePageExists = await fileExists(
          `./rosey/translations/fr-FR/${customNamespacePage}.yaml`
        );
        expect(customNamespacePageExists).toBe(true);

        const defaultNamespacePageExists = await fileExists(
          defaultNamespacePagePath
        );
        expect(defaultNamespacePageExists).toBe(true);
      });

      test("Freshly generated translation files contain urlTranslation key", async () => {
        expect(translationData).toHaveProperty("urlTranslation");
      });

      test("Freshly generated translation files contain an empty Rosey id key", async () => {
        expect(translationData).toHaveProperty(noTranslationRoseyId);
        expect(translationData[noTranslationRoseyId]).toBe("");
      });

      test("Freshly generated translation files contain input config", async () => {
        expect(translationData).toHaveProperty("_inputs");
        expect(Object.keys(translationData["_inputs"]).length).toBeGreaterThan(
          0
        );
      });

      test("An input of type: text is created", async () => {
        expect(translationData).toHaveProperty(textRoseyId);

        const keyIsTypeText =
          translationData._inputs[textRoseyId].type === "text";
        expect(keyIsTypeText).toBe(true);
      });

      test("An input of type: textarea is created", async () => {
        expect(translationData).toHaveProperty(longPhraseRoseyId);

        const keyIsTypeTextArea =
          translationData._inputs[longPhraseRoseyId].type === "textarea";
        expect(keyIsTypeTextArea).toBe(true);
      });

      test("An input of type: markdown is created", async () => {
        expect(translationData).toHaveProperty(markdownRoseyId);

        const keyIsTypeMarkdown =
          translationData._inputs[markdownRoseyId].type === "markdown";
        expect(keyIsTypeMarkdown).toBe(true);
      });

      test("Markdown options are added to a keys input config if containing a markdown namespace", async () => {
        const markdownOptionsPath =
          translationData._inputs[markdownRoseyId].options;
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

      test("A translation with a long original text has a context field in its input config and label concat", async () => {
        expect(translationData).toHaveProperty(longPhraseRoseyId);

        const keyHasContextContent =
          translationData._inputs[longPhraseRoseyId].context.content?.length >
          0;
        expect(keyHasContextContent).toBe(true);

        const keyHasLabelConcat =
          translationData._inputs[longPhraseRoseyId].label.endsWith("...");
        expect(keyHasLabelConcat).toBe(true);
      });

      test("Inputs contain formatted 'See on page' comments if enabled", async () => {
        const formattedComment =
          "[See in context](https://adjective-noun.cloudvent.net/index.html#:~:text=This%20piece%20of%20text%20has%20no%20translation.)";
        expect(translationData._inputs[noTranslationRoseyId].comment).toBe(
          formattedComment
        );
      });

      test("The page has a git repository link if enabled", async () => {
        const formattedLink =
          "//  [Git history](https://github.com/org/repo/commits/main/rosey/translations/fr-FR/home.yaml)";
        const pageCommentEndsWithFormattedLink =
          translationData._inputs.$.comment.endsWith(formattedLink);
        expect(pageCommentEndsWithFormattedLink).toBe(true);
      });
    });

    describe("The generation of locales files", () => {
      test("A locales directory is created", async () => {
        const localeDirectoryExists = await isDirectory("./rosey/locales");
        expect(localeDirectoryExists).toBe(true);
      });

      test("A locales JSON file is created", async () => {
        const localeFileExists = await fileExists(localeFilePath);
        expect(localeFileExists).toBe(true);
      });

      test("A Rosey id is added to the locales file", async () => {
        expect(localeData).toHaveProperty(noTranslationRoseyId);
      });

      test("A Rosey id with no translation falls back to use the original for it's value", async () => {
        expect(localeData[noTranslationRoseyId].value.trim()).toBe(
          "This piece of text has no translation."
        );
      });
    });
  });

  describe("Run the RCC on a site containing existing translations", () => {
    const existingTranslationToPreserve =
      "An existing translation to preserve.";
    const existingTranslationToPreserveId =
      "a-rosey-id-with-a-translation-to-preserve";

    const duplicateTranslationPage =
      "./rosey/translations/fr-FR/a-dir/a-page-with-duplicate-translation.yaml";
    const duplicateTranslationPhrase = "This is a duplicate translation";

    let localeData;
    let translationData;

    // Add some translations files containing translations before we run generate again
    beforeAll(async () => {
      // Create an existing translation file that contains translations
      const existingTranslationPageData = await readYaml(translationFilePath);
      existingTranslationPageData[existingTranslationToPreserveId] =
        existingTranslationToPreserve;
      await fs.promises.writeFile(
        translationFilePath,
        YAML.stringify(existingTranslationPageData)
      );

      // Add duplicate translations here - one is to be removed later
      const existingHomepageTranslations = await readYaml(translationFilePath);
      const existingDupePageTranslations = await readYaml(
        duplicateTranslationPage
      );
      existingHomepageTranslations[textRoseyId] = duplicateTranslationPhrase;
      existingDupePageTranslations[textRoseyId] = duplicateTranslationPhrase;
      await fs.promises.writeFile(
        translationFilePath,
        YAML.stringify(existingHomepageTranslations)
      );
      await fs.promises.writeFile(
        duplicateTranslationPage,
        YAML.stringify(existingDupePageTranslations)
      );

      // Simulate running a postbuild
      await generate();

      localeData = await readJson(localeFilePath);
      translationData = await readYaml(translationFilePath);

      return;
    });

    test("An existing translation is preserved", async () => {
      expect(translationData[existingTranslationToPreserveId].trim()).toBe(
        existingTranslationToPreserve
      );
    });

    test("Translations are correctly grouped into 'Still to translated', or 'Translated' in the page root obj input config", async () => {
      const stillToTranslateList =
        translationData._inputs.$.options.groups[0].inputs;
      expect(stillToTranslateList.length).toBe(4);

      const alreadyTranslatedList =
        translationData._inputs.$.options.groups[1].inputs;
      expect(alreadyTranslatedList.length).toBe(2);
    });

    test("An existing translation makes it to locales", async () => {
      expect(localeData[existingTranslationToPreserveId].value.trim()).toBe(
        existingTranslationToPreserve
      );
    });

    describe("Testing when things are deleted", () => {
      beforeAll(async () => {
        const existingBaseJsonData = await readJson(baseJsonPath);
        const existingBaseUrlData = await readJson(baseUrlJsonPath);

        // As if a whole page with it's id has been deleted
        delete existingBaseJsonData.keys["a-page-about-to-be-deleted"];
        delete existingBaseUrlData.keys["a-dir/a-page-to-be-deleted.html"];

        // As if a page with it's last active rosey id is deleted, but the page remains
        delete existingBaseJsonData.keys[
          "this-page-will-stay-but-the-id-will-go"
        ];

        await fs.promises.writeFile(
          baseJsonPath,
          JSON.stringify(existingBaseJsonData)
        );
        await fs.promises.writeFile(
          baseUrlJsonPath,
          JSON.stringify(existingBaseUrlData)
        );

        const existingConfigData = await readYaml(configFilePath);
        // Remove a namespace page from the config, re-run and expect it to no longer be in the translations
        for (const [
          index,
          namespace_page,
        ] of existingConfigData.namespace_pages.entries()) {
          if (namespace_page === "common") {
            existingConfigData.namespace_pages.splice(index, 1);
          }
        }

        // Disable see on page comments and check they are subsequently disabled on translation pages
        existingConfigData.see_on_page_comment.enabled = false;

        // Disable git history comments and check they are subsequently disabled on translation pages
        existingConfigData.git_history_link.enabled = false;

        await fs.promises.writeFile(
          configFilePath,
          YAML.stringify(existingConfigData)
        );

        // Delete duped key off home
        // Expect it to be deleted from a-page-with-duplicate-translations
        const existingHomepageTranslations = await readYaml(
          translationFilePath
        );
        existingHomepageTranslations[textRoseyId] = "";
        await fs.promises.writeFile(
          translationFilePath,
          YAML.stringify(existingHomepageTranslations)
        );

        // Re-run generate
        await generate();
      });

      test("Translation files are archived if their page is removed", async () => {
        // Check archived in rosey dir
        const archivedDirExists = await isDirectory("./rosey/archived");
        expect(archivedDirExists).toBe(true);
        // Check it doesn't exist in translation file as well
        const deletedPageExistsInTranslationsFiles = await fileExists(
          "./rosey/translations/fr-FR/a-dir/a-page-to-be-deleted.yaml"
        );
        expect(deletedPageExistsInTranslationsFiles).toBe(false);
      });

      test("Translation files are removed if all of the Rosey ids on its page are removed", async () => {
        const deletedPageExistsInTranslationsFiles = await fileExists(
          "./rosey/translations/fr-FR/a-dir/a-page-with-ids-to-be-removed.yaml"
        );
        expect(deletedPageExistsInTranslationsFiles).toBe(false);
      });

      test("Namespace page files are archived if they're removed from config", async () => {
        const deletedNamespacePageExists = await fileExists(
          defaultNamespacePagePath
        );
        expect(deletedNamespacePageExists).toBe(false);
      });

      test("An input does not have a `See on page` link if not enabled", async () => {
        const homepageTranslations = await readYaml(translationFilePath);
        expect(homepageTranslations._inputs[textRoseyId].comment).toBe("");
      });

      test("The page does not have a git repository link if not enabled", async () => {
        const homepageTranslations = await readYaml(translationFilePath);
        expect(homepageTranslations._inputs.$.comment).toBe("");
      });

      test("Clearing a translation updates duplicates with translations that used to exist", async () => {
        // (To be empty)
        // (And fallback to the original in the locales file)
        // Add the key a-simple-text-input to another page so that there are duplicates
        // Both pages should contain the translation for that key
        // Clearing the translation on one page and re-running should clear the translation on other pages
        const duplicatePageTranslations = await readYaml(
          duplicateTranslationPage
        );
        expect(duplicatePageTranslations[textRoseyId]).toBe("");
        const localeData = await readJson(localeFilePath);
        expect(localeData[textRoseyId].value).toBe(
          localeData[textRoseyId].original
        );
      });
    });
  });
});
