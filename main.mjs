#!/usr/bin/env node
import { generate } from "./rosey-connector/main.mjs";
import { tag } from "./rosey-tagger/main.mjs";
import { generateConfigPrompts } from "./utils/generate-config-prompts.mjs";

(async () => {
  // Check which command we are running after rosey-cloudcannon-connector
  // The first two args are `npx` and `rosey-cloudcannon-connector`
  const rccCommand = process.argv[2];

  const validCommands = ["generate", "tag", "generate-config"];

  // Throw error if we don't get one of the correct values directly after npx rosey-cloudcannon-connector
  if (!validCommands.includes(rccCommand)) {
    throw new Error(
      "Command not recognized for the rosey-cloudcannon-connector. Valid commands are 'generate', 'tag', or 'generate-config'."
    );
  }

  // npx rosey-cloudcannon-connector generate
  if (rccCommand === "generate") {
    generate();
  }

  // npx rosey-cloudcannon-connector generate
  if (rccCommand === "generate-config") {
    generateConfigPrompts();
  }

  // Pass the tagger the other args
  // npx rosey-cloudcannon-connector tag --source outputDir --verbose
  const restOfArgs = process.argv.slice(3);
  if (rccCommand === "tag") {
    tag(restOfArgs);
  }
})();
