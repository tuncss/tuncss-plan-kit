#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const PKG_NAME = "tuncss-plan-kit";

const SKILLS = ["brainstorm", "plan-universal", "handoff-plan", "changelog"];
const COMMANDS = ["brainstorm", "plan-universal", "handoff-plan", "changelog"];
const MARKER_START = "<!-- tuncss-plan-kit:start -->";
const MARKER_END = "<!-- tuncss-plan-kit:end -->";

const PLATFORMS = {
  claude: {
    label: "claude",
    project: {
      skillsDir: ".claude/skills",
      commandsDir: null,
      instructionsFile: "CLAUDE.md",
    },
    global: (home) => ({
      skillsDir: path.join(home, ".claude", "skills"),
      commandsDir: null,
      instructionsFile: path.join(home, ".claude", "CLAUDE.md"),
    }),
    commandsSrc: null,
    skipCommands: true,
  },
  codex: {
    label: "codex",
    project: {
      skillsDir: ".agents/skills",
      commandsDir: ".codex/prompts",
      instructionsFile: "AGENTS.md",
    },
    global: (home) => ({
      skillsDir: path.join(home, ".agents", "skills"),
      commandsDir: path.join(home, ".codex", "prompts"),
      instructionsFile: path.join(home, ".codex", "AGENTS.md"),
    }),
    commandsSrc: "codex",
  },
  opencode: {
    label: "opencode",
    project: {
      skillsDir: ".opencode/skills",
      commandsDir: ".opencode/commands",
      instructionsFile: "AGENTS.md",
    },
    // Global install for OpenCode uses the npm-plugin route, not file-drop.
    // See installOpenCodeGlobal().
    global: null,
    commandsSrc: "opencode",
  },
  // Antigravity reads .agents/ in a workspace and ~/.gemini/config/ globally.
  // One global location serves all three variants (desktop app, agy CLI, IDE).
  // Like Claude Code, it expands skills into slash commands on its own, so no
  // wrapper files are written.
  antigravity: {
    label: "antigravity",
    project: {
      skillsDir: ".agents/skills",
      commandsDir: null,
      instructionsFile: "AGENTS.md",
    },
    global: (home) => ({
      skillsDir: path.join(home, ".gemini", "config", "skills"),
      commandsDir: null,
      instructionsFile: path.join(home, ".gemini", "config", "AGENTS.md"),
    }),
    commandsSrc: null,
    skipCommands: true,
  },
};

const SUPPORTED = Object.keys(PLATFORMS);

function parseArgs(argv) {
  const args = { command: null, target: null, global: false, force: false };
  for (const a of argv) {
    if (!args.command && !a.startsWith("--")) {
      args.command = a;
    } else if (a.startsWith("--target=")) {
      args.target = a
        .slice("--target=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === "--global") {
      args.global = true;
    } else if (a === "--force") {
      args.force = true;
    } else if (a === "--help" || a === "-h") {
      args.command = "help";
    }
  }
  return args;
}

function printHelp() {
  console.log(`tuncss-plan-kit

Usage:
  npx tuncss-plan-kit init [--target=<list>] [--global] [--force]

Commands:
  init      Install the three skills (brainstorm, plan-universal, handoff-plan)
            into the target platform(s).

Options:
  --target  Comma-separated platforms to install for. Supported:
              claude, codex, opencode, antigravity, all
            If omitted, auto-detects from the current directory.
  --global  Install to user-wide locations.
            For OpenCode this uses the npm-plugin route (installs the package
            into ~/.config/opencode/node_modules/ and registers it in
            opencode.json's plugin array).
  --force   Overwrite existing skill/command files without warning.
            (Instruction-file marker blocks are always idempotent.)

Examples:
  npx tuncss-plan-kit init
  npx tuncss-plan-kit init --target=claude
  npx tuncss-plan-kit init --target=claude,codex
  npx tuncss-plan-kit init --target=all --global
`);
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function detectTargets(cwd) {
  const found = new Set();
  if (exists(path.join(cwd, ".claude")) || exists(path.join(cwd, "CLAUDE.md"))) {
    found.add("claude");
  }
  if (exists(path.join(cwd, ".codex"))) found.add("codex");
  if (exists(path.join(cwd, ".opencode"))) found.add("opencode");
  // Antigravity discovers .agents/ and reads AGENTS.md as rules. Its project
  // paths are a subset of Codex's, so adding it here costs no extra files.
  if (exists(path.join(cwd, ".agents"))) found.add("antigravity");
  if (exists(path.join(cwd, "AGENTS.md"))) {
    found.add("antigravity");
    if (!found.has("codex") && !found.has("opencode")) {
      found.add("codex");
      found.add("opencode");
    }
  }
  return [...found];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, force) {
  if (exists(dest) && !force) {
    const a = fs.readFileSync(src, "utf8");
    const b = fs.readFileSync(dest, "utf8");
    if (a === b) return { status: "unchanged", dest };
    fs.writeFileSync(dest, a);
    return { status: "updated", dest };
  }
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, fs.readFileSync(src, "utf8"));
  return { status: "written", dest };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertMarkerBlock(filePath, blockBody) {
  const block = `${MARKER_START}\n${blockBody.trim()}\n${MARKER_END}`;
  let existing = "";
  if (exists(filePath)) existing = fs.readFileSync(filePath, "utf8");
  if (existing.includes(MARKER_START) && existing.includes(MARKER_END)) {
    const re = new RegExp(
      `${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}`,
      "m"
    );
    const next = existing.replace(re, block);
    if (next === existing) return { status: "unchanged" };
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, next);
    return { status: "block-updated" };
  }
  const sep =
    existing.length === 0 ? "" : existing.endsWith("\n") ? "\n" : "\n\n";
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, existing + sep + block + "\n");
  return { status: existing.length === 0 ? "file-created" : "block-appended" };
}

const GITATTRIBUTES_LINE = "docs/CHANGELOG.md merge=union";

// Three people appending changelog entries on separate branches all touch the
// same lines of docs/CHANGELOG.md. The union merge driver keeps both sides
// instead of raising a conflict on every merge.
function ensureGitattributes(baseRoot) {
  const filePath = path.join(baseRoot, ".gitattributes");
  let existing = "";
  if (exists(filePath)) existing = fs.readFileSync(filePath, "utf8");
  if (existing.split(/\r?\n/).some((l) => l.trim() === GITATTRIBUTES_LINE)) {
    return { status: "unchanged", dest: filePath };
  }
  const sep = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, existing + sep + GITATTRIBUTES_LINE + "\n");
  return { status: existing.length === 0 ? "written" : "updated", dest: filePath };
}

function loadInstructionsBlock() {
  const tplPath = path.join(PKG_ROOT, "templates", "instructions-block.md");
  const tpl = fs.readFileSync(tplPath, "utf8");
  return tpl.replace(MARKER_START, "").replace(MARKER_END, "").trim();
}

function relPath(p, base) {
  const r = path.relative(base, p);
  return r.split(path.sep).join("/");
}

function statusTag(status) {
  if (status === "unchanged") return "·";
  if (status === "updated" || status === "block-updated") return "↻";
  return "✓";
}

function installPlatform({ platform, isGlobal, force, baseRoot, sharedState }) {
  const cfg = PLATFORMS[platform];
  const paths = isGlobal
    ? cfg.global(os.homedir())
    : {
        skillsDir: path.join(baseRoot, cfg.project.skillsDir),
        commandsDir: cfg.project.commandsDir
          ? path.join(baseRoot, cfg.project.commandsDir)
          : null,
        instructionsFile: path.join(baseRoot, cfg.project.instructionsFile),
      };
  const displayBase = isGlobal ? os.homedir() : baseRoot;

  const lines = [];

  for (const skill of SKILLS) {
    const src = path.join(PKG_ROOT, "skills", skill, "SKILL.md");
    const dest = path.join(paths.skillsDir, skill, "SKILL.md");
    // Codex and Antigravity share .agents/skills; don't copy the same file twice.
    if (sharedState.writtenSkillFiles.has(dest)) {
      lines.push(`  · ${relPath(dest, displayBase)} (already written this run)`);
      continue;
    }
    const r = copyFile(src, dest, force);
    sharedState.writtenSkillFiles.add(dest);
    lines.push(`  ${statusTag(r.status)} ${relPath(r.dest, displayBase)}`);
  }

  if (!cfg.skipCommands) {
    for (const cmd of COMMANDS) {
      const src = path.join(PKG_ROOT, "commands", cfg.commandsSrc, `${cmd}.md`);
      const dest = path.join(paths.commandsDir, `${cmd}.md`);
      const r = copyFile(src, dest, force);
      lines.push(`  ${statusTag(r.status)} ${relPath(r.dest, displayBase)}`);
    }
  } else {
    lines.push(
      `  · (skill names auto-expose as slash commands; no wrapper files needed)`
    );
  }

  if (sharedState.writtenInstructionFiles.has(paths.instructionsFile)) {
    lines.push(
      `  · ${relPath(paths.instructionsFile, displayBase)} (already updated this run)`
    );
  } else {
    const r = upsertMarkerBlock(
      paths.instructionsFile,
      sharedState.instructionsBlock
    );
    sharedState.writtenInstructionFiles.add(paths.instructionsFile);
    lines.push(
      `  ${statusTag(r.status)} ${relPath(paths.instructionsFile, displayBase)} (${r.status})`
    );
  }

  return lines;
}

function readJsonOrDefault(filePath, fallback) {
  if (!exists(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, obj) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n");
}

function isRunningFromInstalledPackage() {
  // If our package root contains /node_modules/, we were installed as a dep
  // (e.g. via `npm install -g` or `npx`). Otherwise we're being run from
  // source (dev mode).
  return PKG_ROOT.split(path.sep).includes("node_modules");
}

function dependencySpec() {
  // When running from a published install, use a version range so npm
  // installs from the registry. When running from source (dev), point to
  // our absolute path with file: so changes are picked up without publish.
  if (isRunningFromInstalledPackage()) {
    return `^${readJsonOrDefault(path.join(PKG_ROOT, "package.json"), { version: "0.1.0" }).version || "0.1.0"}`;
  }
  return "file:" + PKG_ROOT.split(path.sep).join("/");
}

function installOpenCodeGlobal() {
  const home = os.homedir();
  const ocDir = path.join(home, ".config", "opencode");
  ensureDir(ocDir);
  const lines = [];

  // 1. package.json — add or update tuncss-plan-kit dependency
  const pkgPath = path.join(ocDir, "package.json");
  const pkg = readJsonOrDefault(pkgPath, {});
  pkg.dependencies = pkg.dependencies || {};
  const spec = dependencySpec();
  const prevSpec = pkg.dependencies[PKG_NAME];
  pkg.dependencies[PKG_NAME] = spec;
  writeJson(pkgPath, pkg);
  lines.push(
    `  ${prevSpec === spec ? "·" : prevSpec ? "↻" : "✓"} ${relPath(pkgPath, home)} (dep: ${PKG_NAME}@${spec})`
  );

  // 2. npm install in ocDir
  // Pass the full command as a single string with shell: true to avoid the
  // Node DEP0190 warning about unescaped args concatenation. Args are all
  // hardcoded here so there's no injection surface.
  const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
  const npmRes = spawnSync(`${npmBin} install --silent --no-audit --no-fund`, {
    cwd: ocDir,
    stdio: "inherit",
    shell: true,
  });
  if (npmRes.status !== 0) {
    throw new Error(
      `npm install failed in ${ocDir} (exit code ${npmRes.status}). Fix the error above and re-run.`
    );
  }
  lines.push(`  ✓ npm install ran in ${relPath(ocDir, home)}`);

  // 3. command wrappers — file-drop into ~/.config/opencode/commands/
  // (the plugin handles skills via config injection, but command discovery
  // appears to require file-drop)
  const cmdDir = path.join(ocDir, "commands");
  for (const cmd of COMMANDS) {
    const src = path.join(PKG_ROOT, "commands", "opencode", `${cmd}.md`);
    const dest = path.join(cmdDir, `${cmd}.md`);
    const r = copyFile(src, dest, false);
    lines.push(`  ${statusTag(r.status)} ${relPath(r.dest, home)}`);
  }

  // 4. opencode.json — add plugin reference (idempotent)
  const ocJsonPath = path.join(ocDir, "opencode.json");
  const ocJson = readJsonOrDefault(ocJsonPath, {
    $schema: "https://opencode.ai/config.json",
  });
  ocJson.plugin = ocJson.plugin || [];
  // Normalize to strings only (we don't use the [string, object] tuple form)
  const pluginPath = `~/.config/opencode/node_modules/${PKG_NAME}`;
  const alreadyHas = ocJson.plugin.some(
    (p) => p === pluginPath || (Array.isArray(p) && p[0] === pluginPath)
  );
  if (!alreadyHas) {
    ocJson.plugin.push(pluginPath);
  }
  writeJson(ocJsonPath, ocJson);
  lines.push(
    `  ${alreadyHas ? "·" : "✓"} ${relPath(ocJsonPath, home)} (plugin: ${pluginPath})`
  );

  return lines;
}

function init(args) {
  const cwd = process.cwd();

  let targets = args.target;
  if (targets && targets.includes("all")) {
    targets = SUPPORTED.slice();
  }
  if (!targets) {
    targets = detectTargets(cwd);
    if (targets.length === 0) {
      console.error(
        "No supported platform detected in this directory.\n" +
          "Specify one explicitly, e.g.: npx tuncss-plan-kit init --target=claude\n" +
          "Or install for all three: npx tuncss-plan-kit init --target=all"
      );
      process.exit(1);
    }
  }

  const unsupported = targets.filter((t) => !SUPPORTED.includes(t));
  if (unsupported.length > 0) {
    console.error(
      `Unsupported target(s): ${unsupported.join(", ")}.\n` +
        `Supported: ${SUPPORTED.join(", ")}, all.`
    );
    process.exit(1);
  }

  targets = SUPPORTED.filter((p) => targets.includes(p));

  console.log(`tuncss-plan-kit init`);
  console.log(`  scope:  ${args.global ? "global (user-wide)" : "project (./)"}`);
  console.log(`  target: ${targets.join(", ")}`);
  console.log("");

  const sharedState = {
    instructionsBlock: loadInstructionsBlock(),
    writtenInstructionFiles: new Set(),
    writtenSkillFiles: new Set(),
  };

  for (const platform of targets) {
    console.log(`[${platform}]`);
    if (platform === "opencode" && args.global) {
      const lines = installOpenCodeGlobal();
      for (const l of lines) console.log(l);
    } else {
      const lines = installPlatform({
        platform,
        isGlobal: args.global,
        force: args.force,
        baseRoot: cwd,
        sharedState,
      });
      for (const l of lines) console.log(l);
    }
    console.log("");
  }

  if (!args.global) {
    const r = ensureGitattributes(cwd);
    console.log(`[git]`);
    console.log(`  ${statusTag(r.status)} .gitattributes (${GITATTRIBUTES_LINE})`);
    console.log("");
  }

  console.log(
    "Done. Restart your coding agent(s) to pick up new skills and slash commands."
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.command === "help") {
    printHelp();
    process.exit(args.command ? 0 : 1);
  }
  if (args.command === "init") {
    return init(args);
  }
  console.error(`Unknown command: ${args.command}`);
  printHelp();
  process.exit(1);
}

main();
