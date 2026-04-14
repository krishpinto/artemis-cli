// Deploying.jsx — Two-phase deployment screen.
//
// Phase 1 — Pull: runs "docker pull <image>" for each service.
//   This caches images locally so Kubernetes never hits Docker Hub directly.
//   Eliminates ImagePullBackOff errors from rate limits or network flakes.
//
// Phase 2 — Deploy: creates k8s resources (PVC, Deployment, Service).
//   Because images are cached, pods start immediately.

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { createK8sClient } from '../k8s/client.js';
import { deployService, pullImage } from '../k8s/deploy.js';

const STATUS_COLOR = {
  pending:  'gray',
  running:  'yellow',
  done:     'green',
  failed:   'red',
};

export default function Deploying({ context, services, onDone }) {
  // Two separate status maps — one for pull phase, one for deploy phase
  const [pullStatuses,   setPullStatuses]   = useState(Object.fromEntries(services.map(s => [s.id, 'pending'])));
  const [deployStatuses, setDeployStatuses] = useState(Object.fromEntries(services.map(s => [s.id, 'pending'])));
  const [phase, setPhase] = useState('pull'); // 'pull' | 'deploy' | 'done'

  useEffect(() => {
    async function run() {
      // ── Phase 1: Pull all images via Docker ──────────────────────────────
      setPhase('pull');

      // Pull all images in parallel — Docker handles concurrent pulls fine
      await Promise.all(services.map(async (service) => {
        setPullStatuses(prev => ({ ...prev, [service.id]: 'running' }));
        try {
          await new Promise((resolve, reject) => {
            try { pullImage(service.image); resolve(); }
            catch (e) { reject(e); }
          });
          setPullStatuses(prev => ({ ...prev, [service.id]: 'done' }));
        } catch (err) {
          setPullStatuses(prev => ({ ...prev, [service.id]: 'failed' }));
        }
      }));

      // ── Phase 2: Deploy to Kubernetes ────────────────────────────────────
      setPhase('deploy');
      const clients = createK8sClient(context);
      const namespace = 'default';
      const withPrometheus = services.some(s => s.id === 'prometheus');

      const deployPromises = services.map(async (service) => {
        setDeployStatuses(prev => ({ ...prev, [service.id]: 'running' }));
        const result = await deployService(clients, namespace, service, withPrometheus);
        setDeployStatuses(prev => ({ ...prev, [service.id]: result.status === 'deployed' ? 'done' : 'failed' }));
        return result;
      });

      const results = await Promise.all(deployPromises);
      setPhase('done');
      setTimeout(() => onDone(results), 800);
    }

    run();
  }, []);

  const renderRow = (service, status, label) => {
    const color = STATUS_COLOR[status] || 'gray';
    return (
      <Box key={service.id}>
        <Text color="gray">  </Text>
        {status === 'running'
          ? <Text color="yellow"><Spinner type="dots" /></Text>
          : <Text color={color}>{status === 'done' ? '✓' : status === 'failed' ? '✗' : '○'}</Text>
        }
        <Text color={color}>  {service.name.padEnd(14)}</Text>
        <Text color="gray">{label}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingTop={1} paddingLeft={2}>

      {/* Phase 1: Pull */}
      <Text color="cyan" bold>⛽ Phase 1 — Fuelling up</Text>
      <Box marginTop={1} marginBottom={1}>
        <Text color="gray">  Pulling images locally so launch is instant and reliable</Text>
      </Box>
      {services.map(s => renderRow(s, pullStatuses[s.id],
        pullStatuses[s.id] === 'pending'  ? 'waiting...' :
        pullStatuses[s.id] === 'running'  ? `pulling ${s.image}` :
        pullStatuses[s.id] === 'done'     ? 'cached' : 'pull failed, trying anyway'
      ))}

      {/* Phase 2: Deploy */}
      {phase !== 'pull' && (
        <>
          <Box marginTop={1}>
            <Text color="cyan" bold>🚀 Phase 2 — Launch sequence</Text>
          </Box>
          <Box marginTop={1} marginBottom={1}>
            <Text color="gray">  Deploying payload to Kubernetes</Text>
          </Box>
          {services.map(s => renderRow(s, deployStatuses[s.id],
            deployStatuses[s.id] === 'pending'  ? 'waiting...' :
            deployStatuses[s.id] === 'running'  ? 'deploying' :
            deployStatuses[s.id] === 'done'     ? 'deployed' : 'failed'
          ))}
        </>
      )}

    </Box>
  );
}
