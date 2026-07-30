"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "node_modules");
const legacyImport = "var expand = require('brace-expansion')";
const compatibleImport =
  "var braceExpansion = require('brace-expansion')\n" +
  "var expand = braceExpansion.expand || braceExpansion.default || braceExpansion";

function visit(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === ".bin") continue;
    const location = path.join(directory, entry.name);
    if (!entry.isDirectory()) continue;
    const manifest = path.join(location, "package.json");
    if (entry.name === "minimatch" && fs.existsSync(manifest)) {
      const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
      const sourcePath = path.join(location, "minimatch.js");
      if (String(pkg.version).startsWith("3.") && fs.existsSync(sourcePath)) {
        const source = fs.readFileSync(sourcePath, "utf8");
        if (source.includes(legacyImport)) {
          fs.writeFileSync(
            sourcePath,
            source.replace(legacyImport, compatibleImport),
          );
        }
      }
    }
    visit(location);
  }
}

visit(root);
