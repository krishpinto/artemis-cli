// Done.jsx — Final screen. Shows connection strings and auto-starts port forwarding.
//
// Port forwarding starts automatically on mount so users don't need to run
// "artemis connect" separately. The process stays alive until Ctrl+C.

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { spawn } from 'child_process';

// Opens a URL in the default browser — works on Windows, macOS, and Linux.
function openBrowser(url) {
  const opener =
    process.platform === 'win32'  ? spawn('cmd',     ['/c', 'start', url], { shell: true }) :
    process.platform === 'darwin' ? spawn('open',    [url])                                  :
                                    spawn('xdg-open', [url]);
  opener.on('error', () => {}); // silently ignore if opener not found
}
import { SERVICE_CATALOG } from '../services/catalog.js';

// Standard local ports for port-forwarding (cleaner than NodePorts)
const PORT_MAP = {
  postgres:   { local: 5432,  remote: 5432  },
  redis:      { local: 6379,  remote: 6379  },
  mongodb:    { local: 27017, remote: 27017 },
  mysql:      { local: 3306,  remote: 3306  },
  minio:      { local: 9000,  remote: 9000  },
  prometheus: { local: 9090,  remote: 9090  },
  grafana:    { local: 3000,  remote: 3000  },
  rabbitmq:   { local: 5672,  remote: 5672  },
};

// Clean connection strings using standard ports (via port-forward, not NodePort)
const FORWARDED_STRINGS = {
  postgres:   'postgresql://postgres:artemis@localhost:5432/artemis',
  redis:      'redis://localhost:6379',
  mongodb:    'mongodb://artemis:artemis@localhost:27017/artemis',
  mysql:      'mysql://artemis:artemis@localhost:3306/artemis',
  minio:      'http://localhost:9000  (key: artemis / secret: artemis123)',
  prometheus: 'http://localhost:9090',
  grafana:    'http://localhost:3000  (admin / admin)',
  rabbitmq:   'amqp://artemis:artemis@localhost:5672',
};

export default function Done({ results }) {
  const deployed = results.filter(r => r.status === 'deployed');
  const failed   = results.filter(r => r.status === 'failed');
  const getService = (id) => SERVICE_CATALOG.find(s => s.id === id);

  // Track port-forward status per service
  const [fwdStatus, setFwdStatus] = useState(
    Object.fromEntries(deployed.map(r => [r.id, 'starting']))
  );

  // Use a ref (not state) for browserOpened — state causes stale closures inside
  // useEffect, so the flag never actually prevents double-opens.
  // A ref is mutable and always gives the current value inside any closure.
  const browserOpened = React.useRef(false);

  useEffect(() => {
    const activeProcs = {};
    let cancelled = false;

    // markLive — flips a service to 🟢 live and opens the browser the first time
    function markLive(id) {
      setFwdStatus(prev => {
        if (prev[id] === 'live') return prev; // already live, no-op
        const next = { ...prev, [id]: 'live' };
        // Open browser once — use ref so the check is never stale
        if (!browserOpened.current) {
          browserOpened.current = true;
          setTimeout(() => openBrowser('http://localhost:4000'), 500);
        }
        return next;
      });
    }

    // startForward — starts a kubectl port-forward for one service.
    // If it dies (pod not ready yet), waits 3s and retries automatically.
    function startForward(result) {
      if (cancelled) return;
      const pf = PORT_MAP[result.id];
      if (!pf) return;

      setFwdStatus(prev => ({ ...prev, [result.id]: 'starting' }));

      const proc = spawn('kubectl', [
        'port-forward',
        `svc/artemis-${result.id}-svc`,
        `${pf.local}:${pf.remote}`,
      ], { stdio: 'pipe' });

      activeProcs[result.id] = proc;

      // kubectl sometimes writes "Forwarding from" to stdout, sometimes stderr
      // — listen to both so we never miss it.
      // Also: if the port is already bound (previous session still running),
      // kubectl exits with "bind: only one usage..." — that means the forward
      // IS active, just held by the old process. Mark as live immediately.
      function onData(data) {
        const text = data.toString();
        if (text.includes('Forwarding from')) {
          markLive(result.id);
        }
        if (text.includes('bind:') || text.includes('already in use') || text.includes('address already')) {
          markLive(result.id);
        }
      }

      proc.stdout.on('data', onData);
      proc.stderr.on('data', onData);

      proc.on('close', (code) => {
        if (cancelled) return;
        // If port is already in use (exit code 1 + "bind" error), it means
        // a previous port-forward is still holding the port — treat as live.
        // Otherwise retry after 3s.
        setFwdStatus(prev => {
          if (prev[result.id] === 'live') return prev; // already live, don't reset
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
    process.on('exit', cleanup);

    return () => {
      cleanup();
      process.off('SIGINT', cleanup);
    };
  }, []);

  return (
    <Box flexDirection="column" paddingTop={1} paddingLeft={2}>

      <Text color="green" bold>🚀 All systems go — Artemis is in orbit</Text>

      {/* Deployed services with forwarded connection strings */}
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
                  {status === 'live'    && <Text color="green">  🟢 live</Text>}
                  {status === 'starting'&& <Text color="yellow">  ⏳ waiting for pod...</Text>}
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

      <Box flexDirection="column" marginTop={2} paddingLeft={2} borderStyle="single" borderColor="gray">
        <Text color="gray">🛰️  Mission control is live. Press Ctrl+C to abort.</Text>
        <Box marginTop={1}>
          <Text color="cyan">Opening Mission Control at http://localhost:4000 ...</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Run <Text color="white">npx artemis-cli status</Text>  to see this again.</Text>
        </Box>
        <Box>
          <Text color="gray">Run <Text color="white">npx artemis-cli down</Text>    to destroy the mission.</Text>
        </Box>
        <Box>
          <Text color="gray">Run <Text color="white">npx artemis-cli ui</Text>      to reopen the dashboard.</Text>
        </Box>
      </Box>

    </Box>
  );
}
