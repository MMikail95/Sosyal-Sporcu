const fs = require('fs');
try {
  const code = fs.readFileSync('c:\\Users\\Mikimon The Gray\\Documents\\Sosyal Sporcu\\faz2-7.js', 'utf8');
  // Simple syntax check
  new Function(code);
  console.log("No syntax errors!");
} catch (e) {
  console.log("Syntax error:", e);
}
