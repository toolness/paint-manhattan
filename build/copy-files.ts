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
  fs.rmdirSync(OUTPUT_DIR, {recursive: true});
  for (let srcFile of files) {
    const destFile = path.join(OUTPUT_DIR, srcFile);
    const destDir = path.dirname(destFile);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, {recursive: true});
    }
    console.log(`Copying ${srcFile} to ${OUTPUT_DIR}/.`);
    fs.copyFileSync(srcFile, destFile);
  }
}

if (module.parent === null) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
