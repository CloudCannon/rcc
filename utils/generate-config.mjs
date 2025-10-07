import fs from "fs";
import path from "path";
import YAML from "yaml";
import migrateConfig from "./migrate-config.mjs";
import generateDefaultConfigFile from "./generate-default-config.mjs";

export async function generateConfig(
  locales,
  highlightCommentSettings,
  gitHistoryCommentSettings
) {
  const configPath = path.join("rosey", "rcc.yaml");

  // Check if a config already exists
  try {
    await fs.promises.access(configPath);
    console.log("🏗️ Found the RCC config file.");
    // Check for old version without markdown_keys in config
    // If no key (so not empty array) add the default, and it's input config
    const checkedConfig = await migrateConfig(configPath);
    if (checkedConfig.hasMigratedConfig) {
      await fs.promises.writeFile(
        configPath,
        YAML.stringify(checkedConfig.configData)
      );
      console.log("🏗️ Updated the config file.");
    } else {
      console.log("🏗️ Config file already up to date.");
    }
    return;
  } catch (error) {
    console.log("🏗️ No existing config file - Creating one...");
    // If not read the example one
    const exampleConfigString = generateDefaultConfigFile();
    const exampleConfigData = YAML.parse(exampleConfigString.toString("utf-8"));

    // Add to the config file if this is being generated via the cli,
    // otherwise just use the example file if it's happening automatically

    // Add locales to the config
    if (locales?.length) {
      exampleConfigData.locales = locales;
    }
    // Add highlight comment to config
    if (highlightCommentSettings?.isHighlightComment) {
      exampleConfigData.see_on_page_comment.enabled = true;
      exampleConfigData.see_on_page_comment.base_url =
        highlightCommentSettings.untranslatedSiteUrl;
    }
    // Add git history comment to config
    if (gitHistoryCommentSettings?.isGitHistoryComment) {
      exampleConfigData.git_history_link.enabled = true;
      exampleConfigData.git_history_link.repo_url =
        gitHistoryCommentSettings.gitRepoUrl;
      exampleConfigData.git_history_link.branch_name =
        gitHistoryCommentSettings.branchToUse;
    }

    // Create a /rosey/ dir if none exists
    await fs.promises.mkdir("rosey", { recursive: true });

    // Write the example config to the correct place
    await fs.promises.writeFile(configPath, YAML.stringify(exampleConfigData));
    console.log("🏗️ Generated an RCC config file!");
  }
}
