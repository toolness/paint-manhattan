import fs from 'fs';

function main() {
  const dirs = ['dist', 'public'];
  for (let dir of dirs) {
    if (fs.existsSync(dir)) {
      console.log(`Recursively deleting ${dir}/.`);
      fs.rmdirSync(dir, {recursive: true});
    }
  }
}

if (module.parent === null) {
  main();
}
