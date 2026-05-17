/**
 * Patches @aws-amplify/backend-function/lib/factory.js to work on Windows.
 *
 * Root cause: Amplify passes the SSM resolver banner (~13 KB) as an inline
 * esbuild CLI argument. Windows cmd.exe has an 8,191 character command-line
 * limit, so the bundle step exits with "The command line is too long."
 *
 * Fix: write the banner content to a project-local .js file and pass it via
 * the esbuild --inject flag instead of --banner, which keeps the CLI short
 * while still letting esbuild resolve the repo's node_modules.
 */

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const factoryPath = path.resolve(
  __dirname,
  '../node_modules/@aws-amplify/backend-function/lib/factory.js'
);
const invokeShimPath = path.resolve(
  __dirname,
  '../node_modules/@aws-amplify/backend-function/lib/lambda-shims/invoke_ssm_shim.js'
);

const ORIGINAL = `        const bannerCode = readFileSync(ssmResolverFile, 'utf-8')
            .concat(readFileSync(invokeSsmResolverFile, 'utf-8'))
            .split(new RegExp(\`\${EOL}|\\n|\\r\`, 'g'))
            .map((line) => line.replace(/\\/\\/.*$/, '')) // strip out inline comments because the banner is going to be flattened into a single line
            .join('');`;

const PATCHED = `        // --- Windows cmd.exe command-line length patch ---
        // Write the banner into the project so esbuild resolves local packages correctly.
        const bannerCode = '';
        const bannerFileContent = readFileSync(ssmResolverFile, 'utf-8')
            .concat(readFileSync(invokeSsmResolverFile, 'utf-8'));
        const bannerTmpPath = path.join(process.cwd(), '.amplify', 'ssm-banner.js');
        mkdirSync(path.dirname(bannerTmpPath), { recursive: true });
        writeFileSync(bannerTmpPath, bannerFileContent, 'utf-8');
        shims.unshift(bannerTmpPath);
        // --- end patch ---`;

let source = readFileSync(factoryPath, 'utf-8');

if (source.includes('amplify-ssm-banner.js')) {
  console.log('[patch-amplify-windows] Already patched – skipping.');
  process.exit(0);
}

if (!source.includes('const bannerCode = readFileSync(ssmResolverFile')) {
  console.error('[patch-amplify-windows] Could not locate patch target in factory.js – the package may have changed. Skipping.');
  process.exit(0);
}

// Ensure `writeFileSync` and `mkdirSync` are imported
if (!source.includes("writeFileSync")) {
  source = source.replace(
    "import { readFileSync } from 'fs';",
    "import { mkdirSync, readFileSync, writeFileSync } from 'fs';"
  );
}

source = source.replace(ORIGINAL, PATCHED);
writeFileSync(factoryPath, source, 'utf-8');
console.log('[patch-amplify-windows] factory.js patched successfully.');

let invokeShimSource = readFileSync(invokeShimPath, 'utf-8');
const topLevelAwaitSnippet = 'await internalAmplifyFunctionResolveSsmParams();';
if (invokeShimSource.includes(topLevelAwaitSnippet)) {
  invokeShimSource = invokeShimSource.replace(
    topLevelAwaitSnippet,
    "void internalAmplifyFunctionResolveSsmParams().catch((error) => {\n    try {\n        // Attempt to log error\n        console.debug(error);\n        // eslint-disable-next-line @aws-amplify/amplify-backend-rules/no-empty-catch\n    }\n    catch {\n        // Do nothing if logging fails\n    }\n});"
  );
  writeFileSync(invokeShimPath, invokeShimSource, 'utf-8');
  console.log('[patch-amplify-windows] invoke_ssm_shim.js patched successfully.');
}
