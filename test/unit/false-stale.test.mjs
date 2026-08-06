import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { normalizeSource } from "../../dist/internals.mjs";
import { writeLocales } from "../../dist/write-locales.mjs";

// The false-stale seam, end to end: on build, write-locales refreshes
// _base_original and heals an `original` that says the same thing differently; at
// read time, stale detection normalizes both sides. A source differing from the
// stored `original` only by <br> style or whitespace must NOT read as stale, a
// real word change must. Belt and braces — what healing can't reach (list
// tightness needs a DOM) still compares equal.

function seed({ base, locales = {} }) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcc-fs-"));
	const roseyDir = path.join(root, "rosey");
	fs.mkdirSync(path.join(roseyDir, "locales"), { recursive: true });
	fs.writeFileSync(
		path.join(roseyDir, "base.json"),
		JSON.stringify({ version: 2, keys: base }),
	);
	for (const [code, entries] of Object.entries(locales)) {
		fs.writeFileSync(
			path.join(roseyDir, "locales", `${code}.json`),
			JSON.stringify(entries),
		);
	}
	return { roseyDir, dest: path.join(root, "dist") };
}

const baseKey = (original) => ({ original, value: null, pages: {}, total: 1 });
const readFr = (roseyDir) =>
	JSON.parse(
		fs.readFileSync(path.join(roseyDir, "locales", "fr.json"), "utf-8"),
	);

// The base signal computeStale (src/stale.ts) uses: both sides re-normalized.
const baseStale = (e) =>
	normalizeSource(e._base_original) !== normalizeSource(e.original);

test("legacy original differing only by <br>/whitespace is not stale after a build", async () => {
	const { roseyDir, dest } = seed({
		base: { greeting: baseKey("Hello<br>world") },
		locales: {
			fr: {
				greeting: {
					original: "  Hello<br/>world  ",
					value: "Bonjour tout le monde",
					_base_original: "  Hello<br/>world  ",
				},
			},
		},
	});

	await writeLocales({ roseyDir, dest, locales: ["fr"] });
	const e = readFr(roseyDir).greeting;

	// _base_original refreshed to the canonical source, and the legacy `original`
	// (XHTML <br/> + outer spaces) healed onto it: same content, one spelling.
	assert.equal(e._base_original, "Hello<br>world");
	assert.equal(e.original, "Hello<br>world");
	assert.equal(baseStale(e), false);
	assert.equal(e.value, "Bonjour tout le monde"); // translation untouched
});

test("an original in the editor's serialization heals onto the build's", async () => {
	const source =
		"<p>A flexible CMS.</p>\n<p>Visual editing previews your changes.</p>";
	const { roseyDir, dest } = seed({
		base: { intro: baseKey(source) },
		locales: {
			fr: {
				intro: {
					// What the client writes on an edit or a resolve: CloudCannon's
					// ProseMirror serialization, with nothing between the blocks.
					original: source.replace(/>\s+</g, "><"),
					value: "<p>Un CMS flexible.</p>",
					_base_original: source,
				},
			},
		},
	});

	await writeLocales({ roseyDir, dest, locales: ["fr"] });
	const e = readFr(roseyDir).intro;

	assert.equal(e.original, source);
	assert.equal(e._base_original, source);
	assert.equal(baseStale(e), false);
});

test("healing leaves a genuinely different original alone", async () => {
	const { roseyDir, dest } = seed({
		base: { greeting: baseKey("<p>Hello</p><p>there</p>") },
		locales: {
			fr: {
				greeting: {
					original: "<p>Hello</p>",
					value: "<p>Bonjour</p>",
					_base_original: "<p>Hello</p>",
				},
			},
		},
	});

	await writeLocales({ roseyDir, dest, locales: ["fr"] });
	const e = readFr(roseyDir).greeting;

	// The anchor is the record of what was reviewed; only an equivalent string
	// may replace it.
	assert.equal(e.original, "<p>Hello</p>");
	assert.equal(baseStale(e), true);
});

test("a genuine word change in the source still reads as stale", async () => {
	const { roseyDir, dest } = seed({
		base: { greeting: baseKey("Goodbye world") },
		locales: {
			fr: {
				greeting: {
					original: "Hello world",
					value: "Bonjour tout le monde",
					_base_original: "Hello world",
				},
			},
		},
	});

	await writeLocales({ roseyDir, dest, locales: ["fr"] });
	const e = readFr(roseyDir).greeting;

	assert.equal(e._base_original, "Goodbye world"); // refreshed to the new source
	assert.equal(e.original, "Hello world"); // review anchor preserved
	assert.equal(baseStale(e), true);
});
