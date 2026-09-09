import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
import fs from 'node:fs';
const res = await postcss([(tw.default ?? tw)()]).process(fs.readFileSync('in.css','utf8'), { from: import.meta.dirname + '/in.css' });
const o = res.css;
const grab = (sel) => { const i = o.indexOf(sel); return i === -1 ? null : [i, o.slice(i, o.indexOf('}', i) + 1).replace(/\s+/g,' ')]; };
for (const sel of ['.focus\\:outline-none:focus', '.focus-visible\\:outline-2:focus-visible', '.focus-visible\\:outline-stone-600:focus-visible']) {
  const g = grab(sel);
  console.log(g ? `@${String(g[0]).padStart(6)}  ${g[1]}` : `MISSING ${sel}`);
}
