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

  describe("Test the config file generation if none exists", () => {
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

  describe("Adding RCC to a site containing a couple of Rosey ids and a config file containing a locale", () => {
    let localeData;

    // Write a locale to the generated config and run generate() again
    beforeAll(async () => {
      const configData = await readYaml("./rosey/rcc.yaml");

      configData.locales.push("fr-FR");

      await fs.promises.writeFile(
        "./rosey/rcc.yaml",
        YAML.stringify(configData)
      );
      await generate();

      localeData = await readJSON("./rosey/locales/fr-FR.json");
      return;
    });

    test("A locales directory is created", async () => {
      const localeDirectoryExists = await isDirectory("./rosey/locales");
      expect(localeDirectoryExists).toBe(true);
    });

    test("A locales JSON file is created", async () => {
      const localeFileExists = await fileExists("./rosey/locales/fr-FR.json");
      expect(localeFileExists).toBe(true);
    });

    test("A Rosey id is added to the locales file", async () => {
      expect(localeData).toHaveProperty("a-test");
    });

    test("A Rosey id with no translation falls back to use the original for it's value", async () => {
      expect(localeData["a-test"].value.trim()).toBe("This is our HTML file.");
    });
  });

  describe("A site containing existing translations running the RCC workflow", () => {
    const translationPageWithTranslation =
      "./rosey/translations/fr-FR/home.yaml";
    const existingTranslationKey = "a-translation-preserved";
    const existingTranslationPhrase = "An existing translation to preserve.";

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

    test("Test an existing translation is preserved", async () => {
      expect(translationData["a-translation-preserved"].trim()).toBe(
        existingTranslationPhrase
      );
    });
    test("Test an existing translation makes it to locales", async () => {
      expect(localeData["a-translation-preserved"].value.trim()).toBe(
        existingTranslationPhrase
      );
    });
  });
});
