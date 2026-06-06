const fs = require('fs');
let content = fs.readFileSync('faz2-7.js', 'utf8');

// Remove the slot onclick line - it contains template literals so match broadly
const slotPattern = /[ \t]+onclick="window\._pitchSelect\('slot',[^"]+\)"\r?\n/;
const match = slotPattern.exec(content);
if (match) {
  console.log('Found slot onclick:', JSON.stringify(match[0]));
  content = content.replace(slotPattern, '');
  console.log('Removed slot onclick');
} else {
  // Try line-by-line
  const lines = content.split('\n');
  const idx = lines.findIndex(l => l.includes("onclick=\"window._pitchSelect('slot'"));
  if (idx !== -1) {
    console.log('Found at line', idx+1, JSON.stringify(lines[idx]));
    lines.splice(idx, 1);
    content = lines.join('\n');
    console.log('Removed via splice');
  } else {
    console.log('Not found!');
  }
}

const stillHas = content.includes("onclick=\"window._pitchSelect('slot'");
console.log('Still has slot onclick:', stillHas);

fs.writeFileSync('faz2-7.js', content, 'utf8');
console.log('Done');
