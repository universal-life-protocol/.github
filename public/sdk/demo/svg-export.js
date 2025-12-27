const fs = require("fs");
const path = require("path");
const { renderSvg } = require("../projection/svg");

const args = process.argv.slice(2);
const inputPath = args[0] || path.join(__dirname, "..", "..", "data", "events.jsonl");
const outputPath = args[1] || path.join(__dirname, "..", "..", "views", "svg-export.svg");
const animate = args.includes("--animate");

const lines = fs.existsSync(inputPath)
  ? fs.readFileSync(inputPath, "utf8").split(/\r?\n/).filter(Boolean)
  : [];

const events = [];
lines.forEach((line) => {
  try {
    events.push(JSON.parse(line));
  } catch {
    // ignore
  }
});

const svg = renderSvg(events, { animate });
fs.writeFileSync(outputPath, svg, "utf8");
process.stdout.write(`wrote ${outputPath}\n`);
