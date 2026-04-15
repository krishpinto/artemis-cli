// index.js — The entry point. This is the first file that runs when you type "artemis".
//
// It handles two things:
//   1. Sub-commands: "artemis status", "artemis down", "artemis connect", "artemis ui"
//   2. Default: renders the full TUI via Ink's render() function

import { render } from 'ink';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import React from 'react';
import App from './app.jsx';
import { createK8sClient } from './k8s/client.js';
import { teardownService } from './k8s/deploy.js';
import { SERVICE_CATALOG } from './services/catalog.js';
import chalk from 'chalk';

// __dirname isn't available in ESM — this is the standard workaround.
// import.meta.url is the file:// URL of the current module; fileURLToPath converts
// it to an OS path, and dirname() gives us the folder it lives in.
const __dirname = dirname(fileURLToPath(import.meta.url));

// process.argv contains all command-line arguments.
// argv[0] = "node", argv[1] = path to this file, argv[2] = the sub-command (if any)
const subcommand = process.argv[2];

// ── "artemis status" ─────────────────────────────────────────────────────────
// Checks which Artemis services are currently deployed and prints connection strings.
// No TUI needed — just print and exit.
if (subcommand === 'status') {
  const { coreV1Api, appsV1Api } = createK8sClient();

  console.log(chalk.cyan('\n  🚀 ARTEMIS — mission status\n'));

  let found = false;
  for (const service of SERVICE_CATALOG) {
    try {
      // Try to read the Deployment for this service
      // If it throws, the service isn't deployed
      await appsV1Api.readNamespacedDeployment({
        name: `artemis-${service.id}`,
        namespace: 'default',
      });
      found = true;
      console.log(chalk.green(`  ● ${service.name}`));
      for (const cs of service.connectionStrings) {
        console.log(chalk.cyan(`      ${cs}`));
      }
    } catch {
      // Service not deployed — skip silently
    }
  }

  if (!found) {
    console.log(chalk.gray('  No services in orbit. Run npx artemis to launch.'));
    console.log(chalk.gray('  Run npx artemis to deploy some.\n'));
  } else {
    console.log(chalk.gray('\n  Run npx artemis down to tear everything down.\n'));
  }
  process.exit(0);
}

// ── "artemis down" ────────────────────────────────────────────────────────────
// Deletes all Artemis resources from the cluster.
else if (subcommand === 'down') {
  const clients = createK8sClient();

  console.log(chalk.yellow('\n  🔴 Aborting mission — tearing down all services...\n'));

  for (const service of SERVICE_CATALOG) {
    try {
      await teardownService(clients, 'default', service);
      console.log(chalk.green(`  ✓ ${service.name} removed`));
    } catch {
      // If it wasn't deployed, teardown just no-ops — nothing to print
    }
  }

  console.log(chalk.gray('\n  Mission aborted. Run npx artemis to relaunch.\n'));
  process.exit(0);
}

// ── "artemis connect" ─────────────────────────────────────────────────────────
// Port-forwards all deployed services to localhost using standard ports.
// On Docker Desktop for Windows, NodePort services aren't directly accessible —
// this command bridges that gap so connection strings work as shown.
else if (subcommand === 'connect') {
  const { appsV1Api } = createK8sClient();

  // Port mappings: localPort → k8s service name and container port
  const PORT_FORWARDS = [
    { service: 'postgres',   localPort: 5432,  remotePort: 5432  },
    { service: 'redis',      localPort: 6379,  remotePort: 6379  },
    { service: 'mongodb',    localPort: 27017, remotePort: 27017 },
    { service: 'mysql',      localPort: 3306,  remotePort: 3306  },
    { service: 'minio',      localPort: 9000,  remotePort: 9000  },
    { service: 'prometheus', localPort: 9090,  remotePort: 9090  },
    { service: 'grafana',    localPort: 3000,  remotePort: 3000  },
    { service: 'rabbitmq',   localPort: 5672,  remotePort: 5672  },
  ];

  console.log(chalk.cyan('\n  🛰️  ARTEMIS — opening mission control\n'));

  const active = [];

  for (const pf of PORT_FORWARDS) {
    try {
      // Check if this service is deployed
      await appsV1Api.readNamespacedDeployment({
        name: `artemis-${pf.service}`,
        namespace: 'default',
      });

      // Start kubectl port-forward as a background process
      const proc = spawn('kubectl', [
        'port-forward',
        `svc/artemis-${pf.service}-svc`,
        `${pf.localPort}:${pf.remotePort}`,
      ], { stdio: 'pipe' });

      active.push({ ...pf, proc });
      console.log(chalk.green(`  ✓ ${pf.service.padEnd(12)} → localhost:${pf.localPort}`));
    } catch {
      // Service not deployed — skip
    }
  }

  if (active.length === 0) {
    console.log(chalk.gray('  No Artemis services are running. Deploy some first with npx artemis\n'));
    process.exit(0);
  }

  console.log(chalk.gray('\n  Mission control is live. Press Ctrl+C to close.\n'));

  // Keep the Node process alive — without this, Node exits immediately after
  // registering the SIGINT handler because there's nothing left in the event loop.
  const keepAlive = setInterval(() => {}, 1000);

  process.on('SIGINT', () => {
    clearInterval(keepAlive);
    active.forEach(({ proc }) => proc.kill());
    console.log(chalk.yellow('\n  Stopped port forwarding.\n'));
    process.exit(0);
  });
}

// ── "artemis ui" ─────────────────────────────────────────────────────────────
// Starts the Mission Control web dashboard and opens it in your browser.
// The web UI lives in the /web subdirectory of the CLI package.
else if (subcommand === 'ui') {
  // Work out where the web/ folder is, relative to this source file.
  // In development: src/ lives next to web/, so go up one level.
  // When bundled to dist/: dist/ also lives next to web/, same logic.
  const webDir = resolve(__dirname, '..', 'web');

  if (!existsSync(webDir)) {
    console.log(chalk.red('\n  ✗ Web UI not found.'));
    console.log(chalk.gray(`  Expected it at: ${webDir}`));
    console.log(chalk.gray('  Make sure you cloned the full repo.\n'));
    process.exit(1);
  }

  console.log(chalk.cyan('\n  🛰️  ARTEMIS — launching Mission Control\n'));

  // Animates a rocket bouncing across a track while the cat watches.
  // Returns stop() which clears the line and restores the cursor.
  function startAnimation(label) {
    const width = 8;
    let pos = 0, dir = 1;
    process.stdout.write('\x1B[?25l'); // hide cursor while animating
    const draw = () => {
      const track = Array(width).fill('·');
      track[pos] = '🚀';
      process.stdout.write(`\r  😸  ${track.join(' ')}  ${chalk.gray(label)}`);
      pos += dir;
      if (pos >= width - 1) dir = -1;
      if (pos <= 0)         dir =  1;
    };
    draw();
    const timer = setInterval(draw, 120);
    return () => {
      clearInterval(timer);
      process.stdout.write('\x1B[?25h'); // restore cursor
      process.stdout.write('\r' + ' '.repeat(72) + '\r');
    };
  }

  // If web/node_modules is missing (fresh npx install), run `npm install` first.
  // Suppress npm's noisy output and show the animation instead.
  const webModules = resolve(webDir, 'node_modules');
  if (!existsSync(webModules)) {
    const stopInstall = startAnimation('Installing web dependencies (first run only)...');
    const install = spawn('npm', ['install'], { cwd: webDir, stdio: 'pipe', shell: true });
    await new Promise((res, rej) => {
      install.on('close', code => code === 0 ? res() : rej(new Error(`npm install failed (exit ${code})`)));
    });
    stopInstall();
    console.log(chalk.green('  ✓ Dependencies ready\n'));
  }

  // Start Next.js and watch stdout for the "Ready" signal.
  // Only open the browser once the server is actually up — no more blind timeouts.
  const stopStarting = startAnimation('Starting Mission Control...');
  let serverReady = false;

  const webServer = spawn('npm', ['run', 'dev'], {
    cwd: webDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  webServer.stdout.on('data', (data) => {
    const text = data.toString();
    if (!serverReady && text.includes('Ready')) {
      serverReady = true;
      stopStarting();
      console.log(chalk.green('  ✓ Mission Control is live →') + chalk.cyan.bold(' http://localhost:4000\n'));
      const url = 'http://localhost:4000';
      const opener =
        process.platform === 'win32'  ? spawn('cmd',      ['/c', 'start', url], { shell: true }) :
        process.platform === 'darwin' ? spawn('open',     [url])                                  :
                                        spawn('xdg-open', [url]);
      opener.on('error', () => console.log(chalk.cyan(`\n  → Open manually: ${url}\n`)));
    } else if (serverReady) {
      // Forward any subsequent Next.js output (recompiles, errors) to the terminal
      process.stdout.write(text);
    }
  });

  // Always forward stderr — catches port-in-use and other startup errors
  webServer.stderr.on('data', (data) => process.stderr.write(data));

  webServer.on('close', (code) => {
    if (!serverReady) stopStarting();
    console.log(chalk.yellow(`\n  Mission Control shut down (exit code ${code}).\n`));
    process.exit(code ?? 0);
  });

  // Ctrl+C should also kill the web server cleanly
  process.on('SIGINT', () => {
    webServer.kill();
    process.exit(0);
  });
}

// ── Default: launch the full interactive TUI ──────────────────────────────────
// Only render the TUI if no subcommand was given.
// Without this else, the render() runs even after "artemis connect" is handled above.
else {
  render(<App />);
}
