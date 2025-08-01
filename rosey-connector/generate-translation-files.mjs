import fs from "fs";
import YAML from "yaml";
import path from "path";
import {
  readJsonFromFile,
  readTranslationFile,
  archiveOldTranslationFiles,
  getYamlFileName,
  createParentDirIfExists,
  handleConfigPaths,
} from "../utils/file-helpers.mjs";
import {
  initDefaultInputs,
  getInputConfig,
  initNamespacePageInputs,
  getNamespaceInputConfig,
  sortTranslationIntoInputGroup,
} from "../utils/input-helpers.mjs";

export async function generateTranslationFiles(configData) {
  // Get all the config data
  const locales = configData.locales;
  const seeOnPageCommentSettings = configData.see_on_page_comment;
  const gitHistoryCommentSettings = configData.git_history_link;
  const inputLengths = configData.input_lengths;
  const baseFilePath = handleConfigPaths(
    configData.rosey_paths.rosey_base_file_path
  );
  const baseUrlFilePath = handleConfigPaths(
    configData.rosey_paths.rosey_base_urls_file_path
  );
  const translationFilesDirPath = handleConfigPaths(
    configData.rosey_paths.translations_dir_path
  );
  const namespaceArray = configData.namespace_pages;

  // Get the base.json and base.urls.json
  const baseFileData = await readJsonFromFile(baseFilePath);
  const baseUrlFileData = await readJsonFromFile(baseUrlFilePath);

  // Generate translation files for each locale
  for (let i = 0; i < locales.length; i++) {
    const locale = locales[i];

    await generateTranslationFilesForLocale(
      locale,
      seeOnPageCommentSettings,
      gitHistoryCommentSettings,
      inputLengths,
      baseFileData,
      baseUrlFileData,
      translationFilesDirPath,
      namespaceArray
    ).catch((err) => {
      console.error(`\n❌ Encountered an error translating ${locale}:`, err);
    });
  }
}

async function generateTranslationFilesForLocale(
  locale,
  seeOnPageCommentSettings,
  gitHistoryCommentSettings,
  inputLengths,
  baseFileData,
  baseUrlFileData,
  translationFilesDirPath,
  namespaceArray
) {
  console.log(`\n🌍 Processing locale: ${locale}`);
  const logStatistics = {
    numberOfTranslationFilesUpdated: 0,
    numberOfNamespaceTranslationFilesUpdated: 0,
  };
  // Get pages from the base.urls.json
  const baseUrlFileDataKeys = baseUrlFileData.keys;
  const pages = Object.keys(baseUrlFileDataKeys);

  // Make sure there is a directory for the translation files to go in
  const translationsLocalePath = path.join(translationFilesDirPath, locale);
  await fs.promises.mkdir(translationsLocalePath, { recursive: true });

  // Get current translation files
  const translationsFiles = await fs.promises.readdir(translationsLocalePath, {
    recursive: true,
  });

  // Remove translations pages that are no longer present in the base.json file or are one of our namepace-created files
  await archiveOldTranslationFiles(
    translationsFiles,
    translationsLocalePath,
    baseUrlFileDataKeys,
    pages,
    namespaceArray
  );

  // Loop through the pages present in the base.json
  await Promise.all(
    pages.map(async (page) => {
      const translationDataToWrite = {};

      // Get the path of the equivalent translation page to the base.json one we're on
      const yamlPageName = getYamlFileName(page);
      const translationFilePath = path.join(
        translationFilesDirPath,
        locale,
        yamlPageName
      );
      // Ensure nested translation pages have parent directory
      await createParentDirIfExists(page, translationFilesDirPath, locale);

      // Get existing translation page data, returns a fallback if none exists
      const translationFileData = await readTranslationFile(
        translationFilePath
      );
      // Set up inputs for the page if none exist already
      initDefaultInputs(
        translationDataToWrite,
        translationFilesDirPath,
        page,
        locale,
        seeOnPageCommentSettings,
        gitHistoryCommentSettings
      );
      // Process the url translation
      processUrlTranslation(translationFileData, translationDataToWrite, page);
      // Process the rest of the translations
      // As part of process translations, look for keys with a value in the namespace array
      // at the start and don't write them to the translation file
      await processTranslations(
        baseFileData,
        translationFileData,
        translationDataToWrite,
        page,
        namespaceArray,
        seeOnPageCommentSettings,
        inputLengths
      );

      // Write the file back once we've processed the translations
      await fs.promises.writeFile(
        translationFilePath,
        YAML.stringify(translationDataToWrite)
      );
      logStatistics.numberOfTranslationFilesUpdated += 1;
    })
  );

  // After the normal pages are done looping and writing,
  // loop over the namespaced pages, and write a file for each
  await Promise.all(
    namespaceArray.map(async (namespace) => {
      const namespaceFilePath = path.join(
        translationFilesDirPath,
        locale,
        `${namespace}.yaml`
      );

      // Get the existing namespace file translations
      const existingNamespaceFileData = await readTranslationFile(
        namespaceFilePath
      ); // Falls back to empty `inputs:` obj

      // Loop through the existing keys again
      const namespaceTranslationDataToWrite = {};
      initNamespacePageInputs(namespaceTranslationDataToWrite, locale);

      await Promise.all(
        Object.keys(baseFileData.keys).map(async (inputKey) => {
          if (!inputKey.startsWith(`${namespace}:`)) {
            return;
          }
          const baseTranslationObj = baseFileData.keys[inputKey];

          // If they exist on the page already, preserve the translation
          if (existingNamespaceFileData[inputKey]) {
            namespaceTranslationDataToWrite[inputKey] =
              existingNamespaceFileData[inputKey];
          } else {
            // Otherwise add them to the namespace page
            namespaceTranslationDataToWrite[inputKey] = "";
          }

          // Set up inputs for each key
          namespaceTranslationDataToWrite._inputs[inputKey] =
            await getNamespaceInputConfig(
              inputKey,
              baseTranslationObj,
              inputLengths
            );

          // Add each entry to page object group depending on whether they are already translated or not
          sortTranslationIntoInputGroup(
            namespaceTranslationDataToWrite,
            inputKey
          );
        })
      );

      // Write the file back once we've processed the translations
      await fs.promises.writeFile(
        namespaceFilePath,
        YAML.stringify(namespaceTranslationDataToWrite)
      );
      logStatistics.numberOfNamespaceTranslationFilesUpdated += 1;
    })
  );

  // Log statistics
  const totalNumberOfPages = Object.keys(baseUrlFileDataKeys).length;
  const totalNumberOfNamespacePages = namespaceArray.length;
  console.log(
    `- ${logStatistics.numberOfTranslationFilesUpdated}/${totalNumberOfPages} Translation files generated.`
  );
  console.log(
    `- ${logStatistics.numberOfNamespaceTranslationFilesUpdated}/${totalNumberOfNamespacePages} Namespace files generated.`
  );
}

function processUrlTranslation(
  translationFileData,
  translationDataToWrite,
  page
) {
  const existingUrlTranslation = translationFileData.urlTranslation;
  if (existingUrlTranslation?.length > 0) {
    translationDataToWrite.urlTranslation = existingUrlTranslation;
  } else {
    translationDataToWrite.urlTranslation = page;
  }
}

async function processTranslations(
  baseFileData,
  translationFileData,
  translationDataToWrite,
  page,
  namespaceArray,
  seeOnPageCommentSettings,
  inputLengths
) {
  await Promise.all(
    // Loop through all the translations in the base.json
    Object.keys(baseFileData.keys).map(async (inputKey) => {
      const baseTranslationObj = baseFileData.keys[inputKey];

      // If translation doesn't exist on this page, exit early
      if (!baseTranslationObj.pages[page]) {
        return;
      }
      // Check for namespace and exit early
      // since this translation key belongs to a ns page, not one of the real pages we're looping through
      let isInputKeyNamespace = false;
      for (const namespace of namespaceArray) {
        if (inputKey.startsWith(`${namespace}:`)) {
          isInputKeyNamespace = true;
          break;
        }
      }
      if (isInputKeyNamespace) {
        return;
      }

      // Only add the key to our output data if it still exists in base.json
      if (translationFileData[inputKey]) {
        translationDataToWrite[inputKey] = translationFileData[inputKey];
      }

      // If entry doesn't exist in our output file but exists in the base.json, add it as an empty translation
      if (!translationDataToWrite[inputKey]) {
        translationDataToWrite[inputKey] = "";
      }

      // Set up inputs for each key
      translationDataToWrite._inputs[inputKey] = await getInputConfig(
        inputKey,
        page,
        baseTranslationObj,
        seeOnPageCommentSettings,
        inputLengths
      );

      // Add each entry to page object group depending on whether they are already translated or not
      sortTranslationIntoInputGroup(translationDataToWrite, inputKey);
    })
  );
}
