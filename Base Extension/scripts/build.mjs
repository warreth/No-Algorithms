import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGETS = ['chrome', 'firefox'];
const VERSION = process.env.NEW_VERSION || '1.0.0';

// Configuration for modularity
const config = {
    chrome: {
        manifestModifiers: (man) => {
            man.background = { service_worker: "sites/background.js" };
            return man; // Chrome MV3 works as is
        }
    },
    firefox: {
        manifestModifiers: (man) => {
            // Firefox specific MV3 requirements
            man.background = { scripts: ["sites/background.js"], type: "module" };
            man.browser_specific_settings = {
                gecko: {
                    id: "no-algorithms@example.com",
                    strict_min_version: "140.0",
                    data_collection_permissions: {
                        required: ["none"]
                    }
                },
                gecko_android: {
                    strict_min_version: "142.0"
                }
            };
            return man;
        }
    }
};

async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

/**
 * Prepends sites/shared/overlay.css to every sites/<site>/style.css in the
 * build output. Extension content CSS cannot reliably @import across files,
 * so the shared design tokens are inlined at build time: one source of
 * truth, zero runtime requests, uniform UI everywhere.
 */
async function inlineSharedCss(sitesOutDir) {
    const sharedCss = await fs.readFile(path.join(ROOT_DIR, 'sites', 'shared', 'overlay.css'), 'utf-8');
    const entries = await fs.readdir(sitesOutDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const siteCss = path.join(sitesOutDir, entry.name, 'style.css');
        try {
            const css = await fs.readFile(siteCss, 'utf-8');
            await fs.writeFile(siteCss, `/* shared overlay tokens (inlined by build) */\n${sharedCss}\n${css}`);
        } catch {
            // Site without a style.css — skip.
        }
    }
}

async function buildTarget(target) {
    console.log(`Building for ${target}...`);
    const outDir = path.join(ROOT_DIR, 'build', target);

    // Clean build directory
    await fs.rm(outDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(outDir, { recursive: true });

    // Copy compiled JS
    await copyDir(path.join(ROOT_DIR, 'dist'), path.join(outDir, 'dist'));

    // Copy assets, then inline the shared overlay CSS into each site bundle.
    await copyDir(path.join(ROOT_DIR, 'sites'), path.join(outDir, 'sites'));
    await copyDir(path.join(ROOT_DIR, 'icons'), path.join(outDir, 'icons'));
    await inlineSharedCss(path.join(outDir, 'sites'));

    // Process manifest
    const manifestRaw = await fs.readFile(path.join(ROOT_DIR, 'manifest.json'), 'utf-8');
    let manifest = JSON.parse(manifestRaw);
    
    manifest.version = VERSION;
    if (config[target].manifestModifiers) {
        manifest = config[target].manifestModifiers(manifest);
    }

    await fs.writeFile(
        path.join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log(`Finished building ${target}.`);
}

async function main() {
    console.log('Compiling TypeScript...');
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

    for (const target of TARGETS) {
        await buildTarget(target);
    }
    
    // Update package.json version as well to keep it in sync
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    pkg.version = VERSION;
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

    console.log('Build complete.');
}

main().catch(console.error);
