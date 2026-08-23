import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const GENERATORS_DIR = 'generators';
const DIST_DIR = 'dist';

// Copies file-by-file rather than fs.cpSync(src, dest, { recursive: true }):
// that single-call form has proven unreliable on some overlay filesystems
// (phantom, unreadable entries left in dist/).
/**
 * Recursively copies src into dest, creating directories as needed.
 *
 * @param src - Source directory.
 * @param dest - Destination directory.
 */
function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

for (const entry of readdirSync(GENERATORS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const templatesDir = join(GENERATORS_DIR, entry.name, 'templates');
  if (!existsSync(templatesDir)) continue;

  copyDir(templatesDir, join(DIST_DIR, templatesDir));
}
