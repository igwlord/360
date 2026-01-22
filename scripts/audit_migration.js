import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../src');
const MIGRATED_COMPONENTS = ['Modal', 'GlassTable', 'GlassSelect'];

// Files to check recursively
function getFiles(dir) {
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map(subdir => {
        const res = path.resolve(dir, subdir);
        return fs.statSync(res).isDirectory() ? getFiles(res) : res;
    });
    return files.reduce((a, f) => a.concat(f), []);
}

console.log("🔍 Starting Migration Audit...\n");

const files = getFiles(SRC_DIR).filter(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
let brokenFiles = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(SRC_DIR, file);
    let issues = [];

    // Check for explicit .jsx imports of migrated components
    MIGRATED_COMPONENTS.forEach(comp => {
        // Regex to find: import ... from '.../Modal.jsx' OR import ... from '.../Modal'
        const jsxImportRegex = new RegExp(`import.*${comp}\.jsx['"]`, 'g');
        if (jsxImportRegex.test(content)) {
            issues.push(`❌ Explicit import of .jsx for ${comp}`);
        }

        const implicitImportRegex = new RegExp(`import.*${comp}['"]`, 'g'); // Ends with quote, no extension
        if (implicitImportRegex.test(content)) {
            // Check if it's NOT .tsx (meaning we haven't patched it yet)
            if (!content.includes(`${comp}.tsx`)) {
                 issues.push(`⚠️ Implicit import of ${comp} (Risk of 404 - Needs .tsx patch)`);
            }
        }
    });

    if (issues.length > 0) {
        brokenFiles.push({ file: relPath, issues });
    }
});

if (brokenFiles.length === 0) {
    console.log("✅ No broken imports found!");
} else {
    console.log(`⚠️ Found issues in ${brokenFiles.length} files:\n`);
    brokenFiles.forEach(bp => {
        console.log(`📄 ${bp.file}`);
        bp.issues.forEach(i => console.log(`  ${i}`));
        console.log('');
    });
}

