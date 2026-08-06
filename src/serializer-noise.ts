// How Rosey and CloudCannon spell the same content differently: Rosey copies the
// built HTML into base.json verbatim, newlines and all; CloudCannon re-serializes
// from ProseMirror, dropping the whitespace between blocks. Pure string work, so
// the CLI, the client and the node tests can all use it.

/**
 * Compare key for two HTML strings: flattens whitespace between tags, `<br/>` vs
 * `<br>`, and whitespace runs. Folding `<br>` to a space means a break-only
 * change doesn't flag; word changes still do. List tightness needs a DOM, so
 * stale.ts layers that on.
 */
export function collapseSerializerNoise(s: string): string {
	return s
		.replace(/>\s+</g, "><")
		.replace(/<br\b[^>]*>/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

const BLOCK_TAG =
	/<\/?(?:address|article|aside|blockquote|dd|details|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hgroup|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi;

/**
 * Space out block tags so a block boundary survives as a word boundary once the
 * tags are gone: `</p>\n<p>` and `</p><p>` must both read as "files. Visual".
 * Inline tags are left alone — padding them would split `un<em>real</em>`.
 */
export function padBlockBoundaries(html: string): string {
	return html.replace(BLOCK_TAG, " $& ");
}
