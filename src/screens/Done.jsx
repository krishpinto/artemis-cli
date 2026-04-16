// Done.jsx — Final screen. Shows connection strings, auto-starts port forwarding,
// and automatically launches the Mission Control web dashboard.

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SERVICE_CATALOG } from '../services/catalog.js';

// Find the web/ folder relative to wherever this CLI is installed.
// process.argv[1] = full path to dist/cli.js
// Going up one level from dist/ lands us at the package root, then into web/
const WEB_DIR = resolve(dirname(process.argv[1]), '..', 'web');

// Opens a URL in the default browser — cross-platform
function openBrowser(url) {
  const opener =
    process.platform === 'win32'  ? spawn('cmd',      ['/c', 'start', url], { shell: true }) :
    process.platform === 'darwin' ? spawn('open',     [url])                                  :
                                    spawn('xdg-open',  [url]);
  opener.on('error', () => {});
}

// Standard local ports for port-forwarding.
// Each entry is an array so multi-port services (MinIO, RabbitMQ) can forward all their ports.
const PORT_MAP = {
  postgres:   [{ local: 5432,  remote: 5432  }],
  redis:      [{ local: 6379,  remote: 6379  }],
  mongodb:    [{ local: 27017, remote: 27017 }],
  mysql:      [{ local: 3306,  remote: 3306  }],
  minio:      [{ local: 9000,  remote: 9000  }, { local: 9001, remote: 9001 }],
  prometheus: [{ local: 9090,  remote: 9090  }],
  grafana:    [{ local: 3000,  remote: 3000  }],
  rabbitmq:   [{ local: 5672,  remote: 5672  }, { local: 15672, remote: 15672 }],
};

const FORWARDED_STRINGS = {
  postgres:   'postgresql://postgres:artemis@localhost:5432/artemis',
  redis:      'redis://localhost:6379',
  mongodb:    'mongodb://artemis:artemis@localhost:27017/artemis',
  mysql:      'mysql://artemis:artemis@localhost:3306/artemis',
  minio:      'Console → http://localhost:9001  (artemis / artemis123)  ·  S3 API → http://localhost:9000',
  prometheus: 'http://localhost:9090',
  grafana:    'http://localhost:3000  (admin / admin)',
  rabbitmq:   'amqp://artemis:artemis@localhost:5672',
};

export default function Done({ results }) {
  const deployed   = results.filter(r => r.status === 'deployed');
  const failed     = results.filter(r => r.status === 'failed');
  const getService = (id) => SERVICE_CATALOG.find(s => s.id === id);

  // Port-forward status per service
  const [fwdStatus, setFwdStatus] = useState(
    Object.fromEntries(deployed.map(r => [r.id, 'starting']))
  );

  // Web UI status — 'installing' | 'starting' | 'ready' | 'unavailable'
  const [uiStatus, setUiStatus] = useState(
    existsSync(WEB_DIR) ? 'installing' : 'unavailable'
  );

  // Refs so closures always see current values (no stale state bugs)
  const browserOpened = React.useRef(false);
  const webProc       = React.useRef(null);

  // ── Port-forwarding ──────────────────────────────────────────────────────────
  useEffect(() => {
    const activeProcs = {};
    let cancelled = false;

    function markLive(id) {
      setFwdStatus(prev => {
        if (prev[id] === 'live') return prev;
        const next = { ...prev, [id]: 'live' };
        // Open browser as soon as the first service is live — but only once
        if (!browserOpened.current) {
          browserOpened.current = true;
          setTimeout(() => openBrowser('http://localhost:4000'), 500);
        }
        return next;
      });
    }

    function startForward(result) {
      if (cancelled) return;
      const ports = PORT_MAP[result.id];
      if (!ports) return;

      setFwdStatus(prev => ({ ...prev, [result.id]: 'starting' }));

      // Pass all port mappings in a single kubectl port-forward call
      const proc = spawn('kubectl', [
        'port-forward',
        `svc/artemis-${result.id}-svc`,
        ...ports.map(p => `${p.local}:${p.remote}`),
      ], { stdio: 'pipe' });

      activeProcs[result.id] = proc;

      function onData(data) {
        const text = data.toString();
        if (text.includes('Forwarding from'))                                     markLive(result.id);
        if (text.includes('bind:') || text.includes('already in use') ||
            text.includes('address already'))                                     markLive(result.id);
      }

      proc.stdout.on('data', onData);
      proc.stderr.on('data', onData);

      proc.on('close', () => {
        if (cancelled) return;
        setFwdStatus(prev => {
          if (prev[result.id] === 'live') return prev;
          return { ...prev, [result.id]: 'starting' };
        });
        setTimeout(() => startForward(result), 3000);
      });
    }

    for (const result of deployed) startForward(result);

    const cleanup = () => {
      cancelled = true;
      Object.values(activeProcs).forEach(p => p.kill());
    };
    process.on('SIGINT', cleanup);
    process.on('exit',   cleanup);
    return () => { cleanup(); process.off('SIGINT', cleanup); };
  }, []);

  // ── Web UI auto-start ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!existsSync(WEB_DIR)) return; // web/ folder not found — skip

    // Step 1: if node_modules is missing, run npm install first (first-time user)
    const needsInstall = !existsSync(resolve(WEB_DIR, 'node_modules'));

    function startWebServer() {
      setUiStatus('starting');

      // Spawn `npm run dev` inside web/ — stdio: pipe so we can detect when it's ready
      const proc = spawn('npm', ['run', 'dev'], {
        cwd:   WEB_DIR,
        stdio: 'pipe',
        shell: true,
      });

      webProc.current = proc;

      // Next.js prints "Ready" when the server is accepting connections
      function onOutput(data) {
        const text = data.toString();
        if (text.includes('Ready') || text.includes('ready') || text.includes('started server')) {
          setUiStatus('ready');
        }
      }

      proc.stdout.on('data', onOutput);
      proc.stderr.on('data', onOutput);
      proc.on('close', () => setUiStatus('unavailable'));
    }

    if (needsInstall) {
      // Run npm install silently, then start the server
      setUiStatus('installing');
      const install = spawn('npm', ['install'], {
        cwd:   WEB_DIR,
        stdio: 'pipe',
        shell: true,
      });
      install.on('close', (code) => {
        if (code === 0) startWebServer();
        else setUiStatus('unavailable');
      });
    } else {
      startWebServer();
    }

    // Kill the web server when the CLI exits
    const cleanup = () => { if (webProc.current) webProc.current.kill(); };
    process.on('SIGINT', cleanup);
    process.on('exit',   cleanup);
    return () => { cleanup(); process.off('SIGINT', cleanup); };
  }, []);

  // ── UI label helpers ─────────────────────────────────────────────────────────
  const UI_LABEL = {
    installing:  { text: '📦 installing dependencies...', color: 'yellow' },
    starting:    { text: '⏳ starting server...',         color: 'yellow' },
    ready:       { text: '🟢 ready at http://localhost:4000', color: 'green'  },
    unavailable: { text: '✗  web UI not found',           color: 'red'    },
  };

  return (
    <Box flexDirection="column" paddingTop={1} paddingLeft={2}>

      <Text color="green" bold>🚀 All systems go — Artemis is in orbit</Text>

      {/* Deployed services */}
      {deployed.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {deployed.map(result => {
            const service = getService(result.id);
            if (!service) return null;
            const status = fwdStatus[result.id];
            const cs = FORWARDED_STRINGS[result.id] || service.connectionStrings[0];
            return (
              <Box key={result.id} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color="green">  ● </Text>
                  <Text color="white" bold>{service.name.padEnd(14)}</Text>
                  {status === 'live'     && <Text color="green">  🟢 live</Text>}
                  {status === 'starting' && <Text color="yellow">  ⏳ waiting for pod...</Text>}
                </Box>
                <Box paddingLeft={5}>
                  <Text color="cyan">{cs}</Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Failed services */}
      {failed.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="red" bold>  Failed to launch:</Text>
          {failed.map(result => (
            <Box key={result.id} flexDirection="column" marginLeft={4}>
              <Text color="red">✗ {getService(result.id)?.name || result.id}</Text>
              {result.error && <Text color="gray">  {result.error}</Text>}
            </Box>
          ))}
        </Box>
      )}

      {/* Mission Control status */}
      <Box flexDirection="column" marginTop={2} paddingLeft={2} borderStyle="single" borderColor="gray">
        <Text color="gray">🛰️  Mission control is live. Press Ctrl+C to abort.</Text>

        <Box marginTop={1}>
          <Text color="gray">  Mission Control  </Text>
          <Text color={UI_LABEL[uiStatus]?.color ?? 'gray'}>
            {UI_LABEL[uiStatus]?.text ?? ''}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Run <Text color="white">npx artemis-cli status</Text>  to see this again.</Text>
        </Box>
        <Box>
          <Text color="gray">Run <Text color="white">npx artemis-cli down</Text>    to destroy the mission.</Text>
        </Box>
      </Box>

    </Box>
  );
}
