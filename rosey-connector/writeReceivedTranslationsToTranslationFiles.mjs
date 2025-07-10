import fs from "fs";
import path from "path";
import { htmlToMarkdown } from "./helpers/html-to-markdown.mjs";
import {
  readJsonFromFile,
  isDirectory,
  readTranslationFile,
} from "./helpers/file-helpers.mjs";

async function writeReceivedTranslationsToTranslationFiles(
  translationFilesDirPath,
  locales,
  incomingTranslationsDir
) {
  // Loop through each locale
  for (const locale of locales) {
    const translationPagesUpdatedLogs = {};

    const smartlingFilePath = path.join(
      incomingTranslationsDir,
      `${locale}.json`
    );

    // Get the downloaded Smartling data for that locale
    const incomingSmartlingData = await readJsonFromFile(smartlingFilePath);
    const incomingSmartlingDataKeys = Object.keys(incomingSmartlingData);

    // Find all the yaml translation files for that locale and read each one
    const translationFilesForLocaleDirPath = path.join(
      translationFilesDirPath,
      locale
    );
    const translationFilePaths = await fs.promises.readdir(
      translationFilesForLocaleDirPath
    );
    console.log(translationFilePaths);
    // Loop through all the files in the locale
    for (const filePath of translationFilePaths) {
      const fullFilePath = path.join(
        translationFilesForLocaleDirPath,
        filePath
      );

      let translationsUpdatedOnPage = 0;
      // Don't try to read a dir
      if (!(await isDirectory(fullFilePath))) {
        const translationFileContents = await readTranslationFile(fullFilePath);

        // For each one look through it for keys that are included in the downloaded Smartling data
        for (const translationKey of Object.keys(translationFileContents)) {
          if (
            incomingSmartlingDataKeys.includes(translationKey) &&
            // If they're blank (an empty string) in the translation file, overwrite with the Smartling data converted to md
            translationFileContents[translationKey] === ""
          ) {
            translationFileContents[translationKey] = htmlToMarkdown(
              incomingSmartlingDataKeys[translationKey]
            );
            // Update this to true to let us know we do need to write the file back
            translationsUpdatedOnPage += 1;
          }
        }

        if (translationsUpdatedOnPage.length) {
          // Update the logs
          translationPagesUpdatedLogs[filePath] = translationsUpdatedOnPage;
          // Write the translation file back to where we found it with the new data
          await fs.promises.writeFile(filePath, translationFileContents);
        }
      }
    }

    // Work out total updates for the logs for each locale
    const pagesUpdated = Object.keys(translationPagesUpdatedLogs);
    if (pagesUpdated.length) {
      let totalKeysUpdated = 0;
      for (const pageWithUpdates of pagesUpdated) {
        totalKeysUpdated += translationPagesUpdatedLogs[pageWithUpdates];
      }
      console.log(
        `Updated ${locale} pages with ${totalKeysUpdated} keys on ${pagesUpdated.length} pages with translations from Smartling.`
      );
    }
  }
}

writeReceivedTranslationsToTranslationFiles(
  "./rosey/translations",
  ["fr-FR"],
  "./rosey/smartling-translations/"
);
