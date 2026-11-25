/**
 * Safe ZIP packaging script for distribution.
 * Guarantees that secrets (.env, .env.local, .env.*) are NEVER included in distributables.
 * Uses only Node.js stdlib (fs, path, zlib).
 *
 * ponytail: Pure stdlib zip writer; upgrade to archiver or git-archive if streaming multi-GB archives.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT_FILE = join(ROOT, 'raiga-gaming-profile.zip');

const IGNORE_PATTERNS = [
    /^\.env(\..+)?$/, // matches .env, .env.local, .env.production, etc. EXCEPT we allow .env.example
    /^\.git/,
    /^\.vercel/,
    /^node_modules/,
    /^dist/,
    /\.zip$/,
    /\.(pem|key|log)$/,
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
];

function shouldInclude(relPath) {
    const norm = relPath.replace(/\\/g, '/');
    const filename = norm.split('/').pop();
    if (filename === '.env.example') return true;
    for (const pat of IGNORE_PATTERNS) {
        if (pat.test(filename) || pat.test(norm)) return false;
    }
    return true;
}

function collectFiles(dir) {
    const result = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        const rel = relative(ROOT, fullPath);
        if (!shouldInclude(rel)) continue;
        if (entry.isDirectory()) {
            result.push(...collectFiles(fullPath));
        } else if (entry.isFile()) {
            result.push({ fullPath, relPath: rel.replace(/\\/g, '/') });
        }
    }
    return result;
}

function createZip(files) {
    const parts = [];
    const centralDirRecords = [];
    let offset = 0;

    for (const file of files) {
        // Hard boundary check
        if (file.relPath === '.env' || (file.relPath.startsWith('.env') && file.relPath !== '.env.example')) {
            throw new Error(`CRITICAL SECURITY FAILURE: Attempted to package secret file ${file.relPath}`);
        }

        const data = readFileSync(file.fullPath);
        const uncompressedSize = data.length;
        const crc = crc32(data);
        const compressed = uncompressedSize > 0 ? deflateRawSync(data) : Buffer.alloc(0);
        const useDeflate = compressed.length < uncompressedSize;
        const body = useDeflate ? compressed : data;
        const compMethod = useDeflate ? 8 : 0;
        const compSize = body.length;
        const nameBuf = Buffer.from(file.relPath, 'utf8');

        // Local file header (30 bytes + name)
        const localHeader = Buffer.alloc(30 + nameBuf.length);
        localHeader.writeUInt32LE(0x04034b50, 0); // signature
        localHeader.writeUInt16LE(20, 4);         // version needed
        localHeader.writeUInt16LE(0x0800, 6);     // flags (UTF-8 filename)
        localHeader.writeUInt16LE(compMethod, 8); // method
        localHeader.writeUInt16LE(0, 10);        // mod time
        localHeader.writeUInt16LE(0x5421, 12);    // mod date (2022-01-01)
        localHeader.writeUInt32LE(crc, 14);       // crc-32
        localHeader.writeUInt32LE(compSize, 18);  // comp size
        localHeader.writeUInt32LE(uncompressedSize, 22); // uncomp size
        localHeader.writeUInt16LE(nameBuf.length, 26);   // name len
        localHeader.writeUInt16LE(0, 28);         // extra len
        nameBuf.copy(localHeader, 30);

        parts.push(localHeader, body);

        // Central directory header (46 bytes + name)
        const cdHeader = Buffer.alloc(46 + nameBuf.length);
        cdHeader.writeUInt32LE(0x02014b50, 0); // signature
        cdHeader.writeUInt16LE(20, 4);         // version made by
        cdHeader.writeUInt16LE(20, 6);         // version needed
        cdHeader.writeUInt16LE(0x0800, 8);     // flags
        cdHeader.writeUInt16LE(compMethod, 10);// method
        cdHeader.writeUInt16LE(0, 12);        // mod time
        cdHeader.writeUInt16LE(0x5421, 14);    // mod date
        cdHeader.writeUInt32LE(crc, 16);       // crc
        cdHeader.writeUInt32LE(compSize, 20);  // comp size
        cdHeader.writeUInt32LE(uncompressedSize, 24); // uncomp size
        cdHeader.writeUInt16LE(nameBuf.length, 28);   // name len
        cdHeader.writeUInt16LE(0, 30);         // extra len
        cdHeader.writeUInt16LE(0, 32);         // comment len
        cdHeader.writeUInt16LE(0, 34);         // disk start
        cdHeader.writeUInt16LE(0, 36);         // internal attrs
        cdHeader.writeUInt32LE(0, 38);         // external attrs
        cdHeader.writeUInt32LE(offset, 42);    // local header offset
        nameBuf.copy(cdHeader, 46);

        centralDirRecords.push(cdHeader);
        offset += localHeader.length + body.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const r of centralDirRecords) {
        cdSize += r.length;
        parts.push(r);
    }

    // End of central directory record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // signature
    eocd.writeUInt16LE(0, 4);          // disk number
    eocd.writeUInt16LE(0, 6);          // start disk
    eocd.writeUInt16LE(files.length, 8); // entries on disk
    eocd.writeUInt16LE(files.length, 10); // total entries
    eocd.writeUInt32LE(cdSize, 12);     // central dir size
    eocd.writeUInt32LE(cdOffset, 16);   // central dir offset
    eocd.writeUInt16LE(0, 20);          // comment len

    parts.push(eocd);
    return Buffer.concat(parts);
}

const files = collectFiles(ROOT);
const zipBuffer = createZip(files);
writeFileSync(OUT_FILE, zipBuffer);

// Verify output zip does not contain secrets
const fileNames = files.map((f) => f.relPath);
if (fileNames.includes('.env') || fileNames.some((f) => f.startsWith('.env') && f !== '.env.example')) {
    throw new Error('Verification failed: Secret environment file found in packaged list!');
}
if (!fileNames.includes('.env.example')) {
    throw new Error('Verification failed: .env.example must be included in distribution package!');
}

console.log(`[package-zip] Successfully packaged ${files.length} files into raiga-gaming-profile.zip (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
console.log('[package-zip] Verified: .env and local secrets strictly excluded; .env.example included.');
