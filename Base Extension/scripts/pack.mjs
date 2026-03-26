import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGETS = [
    { name: 'chrome', ext: 'zip' },
    { name: 'firefox', ext: 'xpi' }
];

async function main() {
    console.log('Packing extensions...');
    
    // Ensure we have a fresh build first
    console.log('Running build before packing...');
    execSync('npm run build:all', { cwd: ROOT_DIR, stdio: 'inherit' });

    for (const target of TARGETS) {
        const buildDir = path.join(ROOT_DIR, 'build', target.name);
        const outFile = path.join(ROOT_DIR, 'build', `${target.name}.${target.ext}`);
        
        console.log(`Zipping ${target.name} to ${outFile}...`);
        
        try {
            // Remove old archive if it exists
            await fs.rm(outFile, { force: true });
            
            // Execute zip command from within the build directory
            // -r: recursive, -q: quiet
            execSync(`zip -rq "../${target.name}.${target.ext}" .`, { 
                cwd: buildDir, 
                stdio: 'inherit' 
            });
            console.log(`✅ Created ${outFile}`);
        } catch (error) {
            console.error(`❌ Failed to pack ${target.name}:`, error.message);
        }
    }

    console.log('Packing complete.');
}

main().catch(console.error);
