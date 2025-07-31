import { readConfigFile, handleConfigPaths } from "../utils/file-helpers.mjs";
import { configWarnings } from "./config-warnings.mjs";
import { checkAndCleanRemovedLocales } from "./clean-unused-files.mjs";
import { callSmartling } from "./call-smartling.mjs";
import { generateTranslationFiles } from "./generate-translation-files.mjs";
import { generateLocales } from "./generate-locales.mjs";
import { generateConfig } from "../utils/generate-config.mjs";

export async function generate() {
  console.log("\n--- Starting Rosey CloudCannon Connector ---");

  console.log("\n🏗️ Reading config file...");
  // Check for a config file and generate one if not found
  await generateConfig();
  const configData = await readConfigFile(
    handleConfigPaths("./rosey/rcc.yaml")
  );

  // Some warnings for commonly forgotten unconfigured values
  configWarnings(configData);

  console.log("\n\n🏗️ Checking for content to archive...");
  await checkAndCleanRemovedLocales(configData);

  console.log("\n\n🏗️ Generating translation files...");
  await generateTranslationFiles(configData);
  console.log("\n🏗️ Finished generating translation files!");

  if (configData.smartling.enabled) {
    console.log("\n\n🤖 Calling Smartling for translations...");
    await callSmartling(configData);
    console.log("🤖 Finished calling & generating Smartling files!");
  }

  console.log("\n\n🏗️ Generating locales files...");
  await generateLocales(configData);
  console.log("\n🏗️ Finished generating locales files!");

  console.log("\n--- Finished Rosey CloudCannon Connector ---");
}
