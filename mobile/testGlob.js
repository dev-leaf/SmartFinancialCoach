const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const androidPath = path.join(projectRoot, 'android');
console.log('androidPath exists?', fs.existsSync(androidPath));

if (fs.existsSync(androidPath)) {
  const findFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findFiles(fullPath));
      } else {
        if (file.includes('MainApplication')) {
          results.push(fullPath);
        }
      }
    });
    return results;
  };
  
  try {
    const mainApps = findFiles(androidPath);
    console.log('Found MainApplication copies:', mainApps);
  } catch (e) {
    console.error('Error walking tree:', e.message);
  }
}
