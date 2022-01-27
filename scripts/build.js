const { writeFileSync, readdir, mkdirSync } = require('fs');
const { join, basename } = require('path');

const build = require('@vercel/ncc');

const srcPath = join(__dirname, '../src');
const distPath = join(__dirname, '../dist');

async function main() {
  mkdirSync(distPath, { recursive: true })

  const files = await new Promise((resolve, reject) => {
    readdir(join(srcPath), (err, files) => {
      if (err) {
        return reject(err);
      }

      resolve(files.map(file => join(srcPath, file)));
    });
  });

  for (const file of files) {
    if (basename(file) === 'index.ts') {
      continue;
    }

    const { code } = await build(file, {
      minify: true,
      sourceMap: false,
    })

    writeFileSync(join(distPath, basename(file).replace('.ts', '.js')), code);
  }
}

main();
