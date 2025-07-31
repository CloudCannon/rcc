import slugify from "slugify";
import { customEncodingForIds } from "./text-formatters.mjs";

function generateRoseyId(text) {
  if (!text) {
    return "";
  }
  // const formattedText = formatTextForIds(text).toLowerCase();
  const slugifiedText = slugify(text);
  // Dont remove special chars, just encode them
  const encodedSlug = customEncodingForIds(slugifiedText);
  return encodedSlug;
}

export { generateRoseyId };
