import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { ONLINE_GLOBS, OFFLINE_GLOBS } from './metadata';

const OUTPUT_DIR = 'public';

async function getFiles(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const watcher = chokidar.watch([
      ...ONLINE_GLOBS,
      ...OFFLINE_GLOBS,
    ]);

    watcher.on('add', path => {
      files.push(path);
    });

    watcher.on('ready', () => {
      watcher.close();
      resolve(files);
    });
  });
}

async function main() {
  const files = await getFiles();
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmdirSync(OUTPUT_DIR, {recursive: true});
  }
  for (let srcFile of files) {
    const destFile = path.join(OUTPUT_DIR, srcFile);
    const destDir = path.dirname(destFile);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, {recursive: true});
    }
    fs.copyFileSync(srcFile, destFile);
  }
  console.log(`Copied ${files.length} files to ${OUTPUT_DIR}/.`);
}

if (module.parent === null) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
