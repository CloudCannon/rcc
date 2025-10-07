import fs from "fs";
import path from "path";
import slugify from "slugify";
import YAML from "yaml";
import { handleConfigPaths, isDirectory } from "../utils/file-helpers.mjs";

const currentDateTime = Date(Date.now()).toString();
const currentDateTimeSlugified = slugify(currentDateTime);
const archivedFilesDir = path.join(
  "rosey",
  "archived",
  currentDateTimeSlugified
);

export async function removeTranslationFilesWithNoActiveIds(
  locale,
  baseFileData,
  translationFilesDirPath
) {
  // We're in a locale
  // Look through each file in the translations directory
  const translationFilesForLocaleDirPath = path.join(
    translationFilesDirPath,
    locale
  );
  const translationFiles = await fs.promises.readdir(
    translationFilesForLocaleDirPath,
    { recursive: true }
  );

  // Look at each file's keys and see if the file only contains deleted translation ids
  await Promise.all(
    translationFiles.map(async (translationFile) => {
      const translationFilePath = path.join(
        translationFilesForLocaleDirPath,
        translationFile
      );

      if (await isDirectory(translationFilePath)) {
        return;
      }

      const translationFileString = await fs.promises.readFile(
        translationFilePath,
        { encoding: "utf-8" }
      );
      const translationFileData = YAML.parse(translationFileString);

      // If the file contains only _inputs, urlTranslation, and id's that cannot be found in the base.json (meaning they've been deleted)
      const translationFileKeys = Object.keys(translationFileData);

      let containsActiveRoseyIds = false;
      for (const roseyId of translationFileKeys) {
        if (baseFileData.keys[roseyId]) {
          containsActiveRoseyIds = true;
        }
      }

      if (!containsActiveRoseyIds) {
        const archivePath = path.join(
          archivedFilesDir,
          locale,
          translationFile
        );

        const lastSlashInPath = archivePath.lastIndexOf("/");
        const archivedFileDir = archivePath.substring(0, lastSlashInPath);
        await fs.promises.mkdir(archivedFileDir, { recursive: true });

        await fs.promises.rename(translationFilePath, archivePath);
        console.log(
          `🧹 Archived ${translationFilePath} since it no longer contains any Rosey ids that exist in the base.json.`
        );
      }
    })
  );
}

export async function checkAndCleanRemovedLocales(configData) {
  const haveWeArchivedFiles = [];
  const translationsDirPath = handleConfigPaths(
    configData.rosey_paths.translations_dir_path
  );
  const localesDirPath = handleConfigPaths(
    configData.rosey_paths.locales_dir_path
  );
  const locales = configData.locales;

  // Remove extra locales in the translations directory
  await fs.promises.mkdir(translationsDirPath, { recursive: true });
  const translationDirs = await fs.promises.readdir(translationsDirPath);

  for (let i = 0; i < translationDirs.length; i++) {
    const localeDir = translationDirs[i];

    if (!locales.includes(localeDir)) {
      // Create an archived dir to keep old files in
      await fs.promises.mkdir(archivedFilesDir, { recursive: true });

      const pathToArchive = path.join(translationsDirPath, localeDir);
      const archiveLocaleDirPath = path.join(archivedFilesDir, localeDir);
      const archivePath = path.join(archiveLocaleDirPath, "translations");

      // Ensure the locale dir exists to move to
      await fs.promises.mkdir(archiveLocaleDirPath, { recursive: true });

      // Move the old translation files
      await fs.promises.rename(pathToArchive, archivePath);
      console.log(`🧹 Archived ${localeDir} translation files.`);
      haveWeArchivedFiles.push(localeDir);
    }
  }

  // Remove extra locales in the locales directory
  await fs.promises.mkdir(localesDirPath, { recursive: true });

  const localeDirs = await fs.promises.readdir(localesDirPath);
  for (let i = 0; i < localeDirs.length; i++) {
    const localeFile = localeDirs[i];
    const localeCode = localeFile.replace(".json", "").replace(".urls", "");

    if (!locales.includes(localeCode)) {
      // Create an archived dir to keep old files in
      await fs.promises.mkdir(archivedFilesDir, { recursive: true });

      const filePathToArchive = path.join(localesDirPath, localeFile);

      // Ensure the locale dir exists to move to
      const archiveLocaleDirPath = path.join(
        archivedFilesDir,
        localeCode,
        "locales"
      );
      await fs.promises.mkdir(archiveLocaleDirPath, { recursive: true });

      // Move the old locale files
      const archivePath = path.join(
        archivedFilesDir,
        localeCode,
        "locales",
        localeFile
      );
      await fs.promises.rename(filePathToArchive, archivePath);
      console.log(`🧹 Archived ${localeCode} locale files.`);
      haveWeArchivedFiles.push(localeCode);
    }
  }

  if (haveWeArchivedFiles.length > 0) {
    const archivedLocales = haveWeArchivedFiles.join(", ");
    console.log(`🧹 Archived ${archivedLocales} files.`);
  } else {
    console.log(`🧹 No old files to archive.`);
  }
}
