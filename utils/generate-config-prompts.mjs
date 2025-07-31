import { input, confirm } from "@inquirer/prompts";
import { generateConfig } from "./generate-config.mjs";

export async function generateConfigPrompts() {
  console.log(
    `🏗️ Answer a few questions to generate your RCC config file. You can change these values later.`
  );

  // Get locales for config
  const localesInput = await input({
    message: "Enter the locales you will be using, separated by a space.",
  });
  const localesToWrite = localesInput.split(" ");

  // Get highlight comment info for config
  const isHighlightComment = await confirm({
    message:
      "Do you want to display a comment on each input that links to the original phrase on the untranslated page?",
    default: true,
  });
  const highlightCommentSettings = {
    isHighlightComment: isHighlightComment,
    untranslatedSiteUrl: "",
  };
  if (isHighlightComment) {
    highlightCommentSettings.untranslatedSiteUrl = await input({
      message:
        "Enter your site's URL. Use the untranslated site if you're editing translations and running the multilingual site generation on separate sites.",
    });
  }

  // Get git history settings
  const isGitHistoryComment = await confirm({
    message:
      "Do you want to display a comment that links to each translation file's git history?",
    default: false,
  });
  const gitHistoryCommentSettings = {
    isGitHistoryComment: isGitHistoryComment,
    gitRepoUrl: "",
    branchToUse: "",
  };
  if (isGitHistoryComment) {
    gitHistoryCommentSettings.gitRepoUrl = await input({
      message: "Enter your git repository's URL.",
    });
    gitHistoryCommentSettings.branchToUse = await input({
      message: "Enter the branch to use.",
    });
  }

  generateConfig(
    localesToWrite,
    highlightCommentSettings,
    gitHistoryCommentSettings
  );

  console.log(`🏗️ Finished generating files...`);
}
