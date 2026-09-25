"use strict";

// Builds dist/translations/en.min.json from the English source strings
// authored in data/ (no Transifex involved). Mirrors what the upstream
// translation export produces for the source language.

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (k === "strings" && obj.strings && typeof obj.strings === "object") {
      for (const [sk, sv] of Object.entries(obj.strings)) out[sk] = sv;
    } else if (obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

const PRESET_KEYS = ["name", "terms", "aliases"];
const CATEGORY_KEYS = ["name", "terms"];
const FIELD_KEYS = ["label", "placeholder", "terms", "labels", "placeholders", "strings"];

function relId(base, file) {
  return path.relative(base, file)
    .replace(/\.json$/, "").split(path.sep)
    .map((seg) => seg.replace(/^_/, "")).join("/");
}

const presets = {};
for (const file of walk(path.join(ROOT, "data", "presets"))) {
  const id = relId(path.join(ROOT, "data", "presets"), file);
  const src = JSON.parse(fs.readFileSync(file, "utf8"));
  presets[id] = pick(src, PRESET_KEYS);
}

const categories = {};
for (const file of walk(path.join(ROOT, "data", "preset_categories"))) {
  const id = "category-" + path.basename(file, ".json");
  const src = JSON.parse(fs.readFileSync(file, "utf8"));
  categories[id] = pick(src, CATEGORY_KEYS);
}

const fields = {};
for (const file of walk(path.join(ROOT, "data", "fields"))) {
  const id = relId(path.join(ROOT, "data", "fields"), file);
  const src = JSON.parse(fs.readFileSync(file, "utf8"));
  fields[id] = pick(src, FIELD_KEYS);
}

const outDir = path.join(ROOT, "dist", "translations");
fs.mkdirSync(outDir, { recursive: true });

const en = { en: { presets: { categories, fields, presets } } };

fs.writeFileSync(
  path.join(outDir, "en.min.json"),
  JSON.stringify(en, null, 4) + "\n"
);
fs.writeFileSync(
  path.join(outDir, "index.min.json"),
  JSON.stringify({ en: { pct: 1 } }) + "\n"
);
console.log(
  `wrote en.min.json: ${Object.keys(presets).length} presets, ` +
  `${Object.keys(fields).length} fields, ${Object.keys(categories).length} categories`
);
