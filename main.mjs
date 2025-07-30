#!/usr/bin/env node
import { generate } from "./rosey-connector/main.mjs";
import { tag } from "./rosey-tagger/main.mjs";

(async () => {
  // Check whether we're running the generate or tag function
  const rccCommand = process.argv[2];

  // Throw error if we don't get one of the correct values after npx rosey-cloudcannon-connector
  if (rccCommand !== "generate" && rccCommand !== "tag") {
    throw new Error(
      "rosey-cloudcannon-connector command not recognized. Must be either 'generate' or 'tag'."
    );
  }

  // npx rosey-cloudcannon-connector generate
  if (rccCommand === "generate") {
    generate();
  }

  // Pass the tagger the other args after the first one
  // npx rosey-cloudcannon-connector tag --source outputDir --verbose
  const restOfArgs = process.argv.slice(3);
  if (rccCommand === "tag") {
    tag(restOfArgs);
  }
})();
