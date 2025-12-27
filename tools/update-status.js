#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = "/home/main/tetragrammatron";
const ARTIFACTS = path.join(ROOT, "core", "virtual-revelation", "artifacts");
const OUT = path.join(ROOT, "public", "status.json");

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

function fileFreshness(filePath, now) {
  if (!fs.existsSync(filePath)) return { state: "missing", age_hours: null };
  const stat = fs.statSync(filePath);
  const ageMs = now - stat.mtimeMs;
  const ageHours = Math.round((ageMs / 3600000) * 10) / 10;
  return { state: ageHours <= 24 ? "fresh" : "stale", age_hours: ageHours };
}

function latestMtime(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir).map((name) => path.join(dir, name));
  let latest = null;
  for (const entry of entries) {
    try {
      const stat = fs.statSync(entry);
      if (!latest || stat.mtimeMs > latest.mtimeMs) {
        latest = stat;
      }
    } catch {
      // ignore
    }
  }
  return latest ? new Date(latest.mtimeMs).toISOString() : null;
}

const now = Date.now();
const wsActive = run("systemctl --user is-active virtual-revelation-ws.service");
const renderEnabled = run("systemctl --user is-enabled virtual-revelation-render.timer");
const svgEnabled = run("systemctl --user is-enabled virtual-revelation-svg-export.timer");
const worldEnabled = run("systemctl --user is-enabled virtual-revelation-world-pack.timer");

const svgFile = path.join(ARTIFACTS, "svg-gltf.gltf").replace("svg-gltf.gltf", "svg-export.svg");
const gltfFile = path.join(ARTIFACTS, "svg-gltf.gltf");
const audioFile = path.join(ARTIFACTS, "physics-audio.wav");

const status = {
  ws: wsActive || "unknown",
  timers: {
    render: renderEnabled || "unknown",
    svg_export: svgEnabled || "unknown",
    world_pack: worldEnabled || "unknown",
  },
  platform: {
    kernel: run("uname -sr") || "unknown",
    arch: run("uname -m") || "unknown",
    hostname: run("hostname") || "unknown",
  },
  last_world_build: latestMtime(ARTIFACTS),
  artifacts: {
    svg: fileFreshness(svgFile, now),
    gltf: fileFreshness(gltfFile, now),
    audio: fileFreshness(audioFile, now),
  },
  version: "0.1.0",
};

fs.writeFileSync(OUT, JSON.stringify(status, null, 2));
