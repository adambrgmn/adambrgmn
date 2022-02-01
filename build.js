import { GithubMarkdown } from 'markdown-to-html';
import * as fs from 'fs';

const md = new GithubMarkdown();
md.bufmax = 2048;

let template = fs.readFileSync('./site/template.html', 'utf-8');
let [head, tail] = template.split('<!-- CONTENT -->');

let out = fs.createWriteStream('./site/index.html');

md.once('end', () => {
  out.write(tail);
  console.log('✔');
});

md.render('./cv.md', {}, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  out.write(head);
  md.pipe(out);
});
