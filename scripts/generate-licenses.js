#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const outputPath = path.join(__dirname, '..', 'public', 'licenses.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const licenses = [];
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

// Process dependencies
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

Object.keys(allDeps).forEach((pkg) => {
  const pkgPath = path.join(nodeModulesPath, pkg);
  const pkgJsonPath = path.join(pkgPath, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    console.warn(`⚠️  package.json not found for ${pkg}`);
    return;
  }

  try {
    const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const licenseFile = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].find((name) =>
      fs.existsSync(path.join(pkgPath, name))
    );

    let licenseText = '';
    if (licenseFile) {
      licenseText = fs.readFileSync(path.join(pkgPath, licenseFile), 'utf-8');
    }

    licenses.push({
      name: pkgData.name,
      version: pkgData.version,
      license: pkgData.license || 'Unknown',
      repository: pkgData.repository?.url || pkgData.repository || '',
      homepage: pkgData.homepage || '',
      licenseText: licenseText,
    });
  } catch (error) {
    console.error(`Error processing ${pkg}:`, error.message);
  }
});

// Sort by name
licenses.sort((a, b) => a.name.localeCompare(b.name));

// Ensure public directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

// Write licenses.json
fs.writeFileSync(outputPath, JSON.stringify(licenses, null, 2));
console.log(`✓ Generated licenses.json with ${licenses.length} dependencies`);
