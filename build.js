import * as fs from 'node:fs';
import * as path from 'node:path';
import stream from 'node:stream';
import { promisify } from 'node:util';
import got from 'got';
import { GithubMarkdown } from 'markdown-to-html';

const md = new GithubMarkdown();
md.bufmax = 2048;

let template = fs.readFileSync('./site/template.html', 'utf-8');
let [head, tail] = template.split('<!-- CONTENT -->');

let out = fs.createWriteStream('./site/index.html');

md.once('end', () => {
  out.write(tail);
  console.log('✔ Markdown');
});

md.render('./cv.md', {}, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  out.write(head);
  md.pipe(out);
});

// Build icons
try {
  const pipeline = promisify(stream.pipeline);

  const buildUrl = (ext, ...transforms) => {
    let t = transforms.join(',');
    return `https://res.cloudinary.com/adambrgmn/image/upload/${t}/v1643730860/cv-favicon_jmeev6.${ext}`;
  };

  let icons = [
    ['icons/icon-512.png', buildUrl('png', 'c_scale', 'w_512')],
    ['icons/icon-192.png', buildUrl('png', 'c_scale', 'w_192')],
    ['icons/apple-touch-icon.png', buildUrl('png', 'c_scale', 'w_180')],
    ['favicon.svg', buildUrl('svg', 'c_scale', 'w_32')],
    ['favicon.ico', buildUrl('ico', 'c_scale', 'w_32', 'fl_preserve_transparency')],
  ];

  let promises = [];

  for (let [filename, url] of icons) {
    let write = fs.createWriteStream(path.join('./site', filename));
    let request = got.stream.get(url);
    promises.push(pipeline(request, write));
  }

  await Promise.all(promises);
  console.log('✔ Icons');
} catch (error) {
  console.error(error);
}
