import assert from "node:assert/strict";
import { test } from "node:test";
import { padBlockBoundaries } from "../../dist/internals.mjs";

// padBlockBoundaries is the DOM-free half of stripToText (src/stale.ts), the key
// behind the live stale signal. stripToText itself needs a real DOM to decode
// entities and drop tags, so what runs here is the invariant that matters: the
// same content serialized by Rosey (newlines between block tags) and by CC's
// editor (nothing between them) must produce the SAME key. `textKey` below
// stands in for the browser's textContent — accurate for the tag-only fragments
// used here, which carry no entities.
const textKey = (html) =>
	padBlockBoundaries(html)
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();

test("adjacent blocks and newline-separated blocks give the same key", () => {
	const rosey = "<p>…and data files.</p>\n<p>Visual editing lets you…</p>";
	const prosemirror = "<p>…and data files.</p><p>Visual editing lets you…</p>";
	assert.equal(textKey(rosey), textKey(prosemirror));
	// The boundary is a real word break, not a deletion.
	assert.equal(
		textKey(prosemirror),
		"…and data files. Visual editing lets you…",
	);
});

test("tight and loose list items give the same key", () => {
	const tight = "<ul>\n<li>One</li>\n<li>Two</li>\n</ul>";
	const loose = "<ul><li><p>One</p></li><li><p>Two</p></li></ul>";
	assert.equal(textKey(tight), textKey(loose));
	assert.equal(textKey(loose), "One Two");
});

test("table cells are boundaries too", () => {
	const spaced = "<table><tr><td>a</td>\n<td>b</td></tr></table>";
	const tight = "<table><tr><td>a</td><td>b</td></tr></table>";
	assert.equal(textKey(spaced), textKey(tight));
	assert.equal(textKey(tight), "a b");
});

test("inline tags are left alone — they are not word boundaries", () => {
	assert.equal(textKey("un<em>real</em>"), "unreal");
	assert.equal(textKey("<strong>bold</strong><em>italic</em>"), "bolditalic");
	assert.equal(padBlockBoundaries("<span>c</span>"), "<span>c</span>");
});

test("a tag whose name only prefixes a block tag is not matched", () => {
	// <pre> must not match the `p` alternative, and <param>/<picture> neither.
	assert.equal(textKey("<pre>a\nb</pre>"), "a b");
	assert.equal(
		padBlockBoundaries("<picture>x</picture>"),
		"<picture>x</picture>",
	);
});

test("tagless input is untouched", () => {
	assert.equal(padBlockBoundaries("Hello world"), "Hello world");
	assert.equal(padBlockBoundaries(""), "");
});

test("attributes on the block tag do not break the match", () => {
	assert.equal(
		textKey('<div class="a">one</div><div data-x="b">two</div>'),
		"one two",
	);
});
