/**
 * Minimal build script for oh-my-claude
 * Compiles TypeScript and lays out files in dist/lib/<module>/
 * matching the paths expected by bash hook scripts.
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, symlinkSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Step 1: Compile TypeScript
console.log('🔨 Compiling TypeScript...');
execSync('npx tsc --project tsconfig.json', { cwd: __dirname, stdio: 'inherit' });

// Step 2: Create dist/lib/ directory structure
const modules = {
  atlas: 'cli.js',                      // from dist/cli.js
  background: 'background-cli.js',      // from dist/background-cli.js
  todo: 'todo-cli.js',                  // from dist/todo-cli.js
  'model-fallback': 'model-fallback-cli.js', // from dist/model-fallback-cli.js
  hashline: 'hash-computation.js',      // from dist/hash-computation.js (library)
};

const distRoot = join(__dirname, 'dist');
const libRoot = join(distRoot, 'lib');

for (const [moduleName, sourceFile] of Object.entries(modules)) {
  const moduleDir = join(libRoot, moduleName);
  const sourcePath = join(distRoot, sourceFile);
  const targetPath = join(moduleDir, 'cli.js');
  const providerDir = join(distRoot, 'provider');
  const providerTargetDir = join(moduleDir, 'provider');

  if (!existsSync(moduleDir)) {
    mkdirSync(moduleDir, { recursive: true });
  }

  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, targetPath);
    console.log(`  ✅ dist/lib/${moduleName}/cli.js`);
  } else {
    console.log(`  ⚠️  Source not found: ${sourceFile} — module ${moduleName} will use fallback`);
  }

  // Copy provider module alongside each CLI entry for relative imports
  if (existsSync(providerDir) && !existsSync(providerTargetDir)) {
    mkdirSync(providerTargetDir, { recursive: true });
    for (const f of readdirSync(providerDir)) {
      const src = join(providerDir, f);
      if (statSync(src).isFile()) {
        copyFileSync(src, join(providerTargetDir, f));
      }
    }
  }

  // Copy provider-init.js to module directory
  const providerInitSrc = join(distRoot, 'provider-init.js');
  if (existsSync(providerInitSrc)) {
    copyFileSync(providerInitSrc, join(moduleDir, 'provider-init.js'));
  }

  // Copy shared dependencies
  // Copy shared dependencies (exclude CLI entry points that are module-specific)
  for (const dep of ['boulder-state.js', 'continuation-injector.js', 'concurrency.js', 'types.js', 'enforcer-state.js', 'state-controller.js', 'hash-computation.js', 'manager.js', 'provider-init.js']) {
    const depSrc = join(distRoot, dep);
    if (existsSync(depSrc)) {
      copyFileSync(depSrc, join(moduleDir, dep));
    }
  }
}

// Step 3: Copy types
for (const f of readdirSync(distRoot)) {
  if (f.endsWith('.d.ts') && statSync(join(distRoot, f)).isFile()) {
    for (const moduleName of Object.keys(modules)) {
      const moduleDir = join(libRoot, moduleName);
      if (existsSync(moduleDir)) {
        copyFileSync(join(distRoot, f), join(moduleDir, f));
      }
    }
  }
}

console.log('✅ Build complete!');
