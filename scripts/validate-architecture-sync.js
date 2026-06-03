#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const REGISTRY_PATH = path.join(__dirname, "../docs/03-audits/ARCHITECTURE_TRIGGER_FILES.md");
const CONTEXT_PATH = "docs/00-core/ARCHITECTURE_CONTEXT.md";
const CHANGELOG_PATH = "docs/00-core/ARCHITECTURE_CHANGELOG.md";
const EXEMPTION_KEYWORD = "[architecture-sync-exempt]";

function getCommitMessage() {
  try {
    return execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
  } catch (e) {
    return "";
  }
}

function loadTriggerRules() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`❌ Error: Trigger registry not found at ${REGISTRY_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(REGISTRY_PATH, "utf8");
  const lines = content.split("\n");
  const watchedPaths = [];

  const triggerLineRegex = /^-\s+`([^`]+)`/;

  lines.forEach(line => {
    const match = line.trim().match(triggerLineRegex);
    if (match) {
      const watchedPath = match[1].trim();
      watchedPaths.push(watchedPath);
    }
  });

  return watchedPaths;
}

function getModifiedFiles() {
  const files = new Set();
  
  // 1. Get last commit time to check filesystem changes for ignored files
  let lastCommitTime = 0;
  try {
    const timestampStr = execSync("git log -1 --format=%ct", { encoding: "utf8" }).trim();
    if (timestampStr) {
      lastCommitTime = parseInt(timestampStr, 10) * 1000;
    }
  } catch (e) {
    // If no commits, fallback to 0 (all files modified)
  }

  // 2. Tracked modified files (staged and unstaged since last commit)
  try {
    const statusOutput = execSync("git diff --name-only HEAD", { encoding: "utf8" });
    statusOutput.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (trimmed) files.add(trimmed);
    });
  } catch (e) {
    // Fallback if no HEAD
  }

  // 3. Check filesystem for watched paths modified since last commit (handles gitignored files)
  const watchedPaths = loadTriggerRules();
  const repoRoot = path.resolve(__dirname, "..");
  
  watchedPaths.forEach(watched => {
    const fullPath = path.join(repoRoot, watched);
    if (!fs.existsSync(fullPath)) return;

    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        const scanDir = (dir) => {
          fs.readdirSync(dir).forEach(file => {
            const subPath = path.join(dir, file);
            const subStats = fs.statSync(subPath);
            if (subStats.isDirectory()) {
              scanDir(subPath);
            } else {
              const relPath = path.relative(repoRoot, subPath);
              if (subStats.mtimeMs > lastCommitTime) {
                files.add(relPath);
              }
            }
          });
        };
        scanDir(fullPath);
      } else {
        if (stats.mtimeMs > lastCommitTime) {
          files.add(watched);
        }
      }
    } catch (err) {
      // Ignore read errors
    }
  });

  // 4. Also check if context and changelog were modified since last commit
  [CONTEXT_PATH, CHANGELOG_PATH].forEach(file => {
    const fullPath = path.join(repoRoot, file);
    if (fs.existsSync(fullPath)) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.mtimeMs > lastCommitTime) {
          files.add(file);
        }
      } catch (err) {
        // Ignore
      }
    }
  });

  // 5. Also check files in the latest commit to support CI post-commit triggers
  try {
    const lastCommitFiles = execSync("git diff-tree --no-commit-id --name-only -r HEAD", { encoding: "utf8" });
    lastCommitFiles.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (trimmed) files.add(trimmed);
    });
  } catch (e) {
    // Ignore
  }

  return Array.from(files);
}

function run() {
  console.log("=== Architecture Synchronization Validator ===");

  // 1. Check for command-line or commit-message exemptions
  const cliArgs = process.argv.slice(2);
  const commitMsg = getCommitMessage();
  const isExempt = cliArgs.includes("--exempt") || 
                   cliArgs.includes(EXEMPTION_KEYWORD) || 
                   commitMsg.includes(EXEMPTION_KEYWORD);

  if (isExempt) {
    console.log(`⚠️ Exemption token '${EXEMPTION_KEYWORD}' detected.`);
    console.log("Validation bypassed by user override.");
    process.exit(0);
  }

  // 2. Load watched files and directories
  const watchedPaths = loadTriggerRules();
  console.log(`Loaded ${watchedPaths.length} watched architectural pathways.`);

  // 3. Get changed files
  const modifiedFiles = getModifiedFiles();
  console.log(`Detected ${modifiedFiles.length} modified/new files in changeset.`);

  if (modifiedFiles.length === 0) {
    console.log("✅ No modified files detected. Skipping check.");
    process.exit(0);
  }

  // 4. Determine if any architectural files are modified
  const triggeringFiles = [];

  modifiedFiles.forEach(file => {
    const isTrigger = watchedPaths.some(watched => {
      if (watched.endsWith("/")) {
        // Directory watch
        return file.startsWith(watched);
      } else {
        // File watch
        return file === watched;
      }
    });

    if (isTrigger) {
      triggeringFiles.push(file);
    }
  });

  // 5. Evaluate synchronization rules
  if (triggeringFiles.length === 0) {
    console.log("✅ No architecture-sensitive files modified. Validation passed.");
    process.exit(0);
  }

  console.log("\n⚠️ Architectural changes detected in the following files:");
  triggeringFiles.forEach(file => console.log(`  - ${file}`));

  const hasContextUpdate = modifiedFiles.includes(CONTEXT_PATH);
  const hasChangelogUpdate = modifiedFiles.includes(CHANGELOG_PATH);

  const missing = [];
  if (!hasContextUpdate) missing.push(CONTEXT_PATH);
  if (!hasChangelogUpdate) missing.push(CHANGELOG_PATH);

  if (missing.length > 0) {
    console.error("\n❌ VALIDATION FAILURE: Architecture documentation is out of sync!");
    console.error(`To maintain documentation integrity, you must update the following files:`);
    missing.forEach(file => console.error(`  - ${file}`));
    console.error(`\nIf this was a non-structural edit, you can bypass this check by adding:`);
    console.error(`  ${EXEMPTION_KEYWORD}`);
    console.error("to your commit message or running the validator with --exempt.");
    process.exit(1);
  }

  console.log("✅ Sync verification passed. Both ARCHITECTURE_CONTEXT.md and ARCHITECTURE_CHANGELOG.md were updated.");
  process.exit(0);
}

run();
