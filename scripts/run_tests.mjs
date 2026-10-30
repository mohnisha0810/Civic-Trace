import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const suiteTs = path.join(rootDir, 'tests', 'suite.ts');
const bundleOut = path.join('/tmp', 'civictrace_app_test_bundle.cjs');

try {
  const esbuildBin = path.join(rootDir, 'node_modules', '.bin', 'esbuild');
  execSync(`"${esbuildBin}" "${suiteTs}" --bundle --platform=node --format=cjs --outfile="${bundleOut}"`, {
    stdio: 'pipe',
  });

  execSync(`node "${bundleOut}"`, {
    stdio: 'inherit',
  });
} catch (err) {
  process.exit(1);
}
