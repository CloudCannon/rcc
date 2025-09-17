import fs from "fs";
import { generate } from "../rosey-connector/main.mjs";
import { execSync } from "child_process";
import { isDirectory, readFile, readJSON, readYaml } from "./utils";

const testBuildDir = "_site";

async function initializeRoseyData() {
  await fs.promises.mkdir("rosey/translations/fr-FR", { recursive: true });

  const exampleConfigData = await readFile("./examples/example-config.yml");
  await fs.promises.writeFile("rosey/rcc.yaml", exampleConfigData);
}

describe("Run the whole RCC workflow", () => {
  // Setup and Teardown
  beforeAll(async () => {
    await fs.promises.rm("./rosey", { recursive: true, force: true });
    await initializeRoseyData();

    execSync(`npx rosey generate --source ${testBuildDir}`);
    await generate();
    return;
  });

  // Tests
  describe("Test the locales files", () => {
    test("Check if a locales directory is created", async () => {
      const result = await isDirectory("./rosey/locales");
      expect(result).toBe(true);
    });

    test("Test a tagged translation makes it to locales file", async () => {
      const fileData = await readJSON("./rosey/locales/fr-FR.json");
      expect(fileData["a-test"].value.trim()).toBe("This is our HTML file.");
    });
  });

  describe("Run the whole RCC workflow with an existing translation", () => {
    beforeAll(async () => {
      // Create an existing translation file and run the rcc again
      const exampleTranslationPageData = await readYaml(
        "./examples/translation-page-home.yml"
      );
      await fs.promises.writeFile(
        "rosey/translations/fr-FR/home.yaml",
        exampleTranslationPageData
      );

      await generate();
      return;
    });
    // TODO:
    test("Test an existing translation makes it to locales", async () => {
      const localesFileData = await readJSON("./rosey/locales/fr-FR.json");
      expect(localesFileData["a-test"].value.trim()).toBe(
        "This is our HTML file."
      );
    });
    // TODO:
    test("Test an existing translation is preserved", async () => {
      const translationFileData = await readYaml(
        "./rosey/translations/fr-FR/home.yaml"
      );
      expect(translationFileData["a-test"].value.trim()).toBe(
        "This is our HTML file."
      );
    });
  });
});
