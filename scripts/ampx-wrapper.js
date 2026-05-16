#!/usr/bin/env node

/**
 * Amplify CLI wrapper to prevent MultipleSandboxInstancesError.
 * 
 * This wrapper intercepts `npx ampx sandbox` calls and cleans up any stale
 * sandbox processes before delegating to the real Amplify CLI. This ensures
 * that multiple accidental sandbox invocations don't lock the project.
 */

import { execSync, spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const projectRoot = resolve(__dirname, '..');

/**
 * Find and kill any stale ampx sandbox processes for this project.
 */
function cleanStaleSandboxes() {
  try {
    // PowerShell command to find and kill stale sandbox processes.
    const psCmd = `
      Get-CimInstance Win32_Process |
        Where-Object {
          $_.CommandLine -match 'ampx sandbox' -and
          $_.CommandLine -match ([regex]::Escape('${projectRoot}'))
        } |
        ForEach-Object {
          Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
    `.trim();

    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd.replace(/"/g, '\\"')}"`, {
      stdio: 'pipe',
    });
  } catch (err) {
    // Silently fail if cleanup doesn't work; the CLI will handle it.
  }
}

/**
 * Invoke the real Amplify CLI via the original ampx.js entry point.
 */
async function runRealAmpx() {
  const realAmpxPath = resolve(
    projectRoot,
    'node_modules/@aws-amplify/backend-cli/lib/ampx.js'
  );

  // Re-invoke Node with the real entry point and all CLI arguments.
  const proc = spawn('node', [realAmpxPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  proc.on('exit', (code) => {
    process.exit(code);
  });
}

// Main: Clean stale processes, then run the real CLI.
cleanStaleSandboxes();
await runRealAmpx();
