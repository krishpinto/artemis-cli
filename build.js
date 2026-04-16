// build.js — esbuild config file.
//
// Instead of passing 20 flags on the command line (which breaks on Windows
// due to quote escaping), we use esbuild's JavaScript API directly.
// Same result, much cleaner.

import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/cli.js',

  // Tell esbuild that .js and .jsx files may contain JSX syntax
  loader: { '.js': 'jsx', '.jsx': 'jsx' },

  // External packages — don't bundle these, leave them as imports.
  // @kubernetes/client-node has native bindings that can't be bundled.
  external: ['@kubernetes/client-node'],

  // Alias react-devtools-core to an empty stub.
  // Ink optionally imports it for dev tooling — we replace it with nothing
  // so esbuild bundles our stub instead of looking for the real package.
  alias: { 'react-devtools-core': './stubs/react-devtools-core.js' },

  // This tells esbuild (and Ink) we're in production mode.
  // Ink checks this to decide whether to load devtools — in production it skips it.
  // __APP_VERSION__ is replaced at bundle time with the version from package.json.
  define: {
    'process.env.NODE_ENV': '"production"',
    '__APP_VERSION__': JSON.stringify(version),
  },

  // The banner is prepended to the top of the output file.
  // We need two things here:
  //   1. The shebang so the OS knows to run this with node
  //   2. A require() shim — some CJS packages inside our dependencies call require()
  //      but ESM modules don't have require. createRequire() from Node's 'module'
  //      package creates a working require() function we can use in ESM context.
  banner: {
    js: `#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);`,
  },
});
