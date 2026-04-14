// deploy.js — Deploys a single service to Kubernetes.
//
// This is the function that does the actual work. It takes a service config
// from catalog.js and creates the necessary k8s resources in order:
//   1. PVC (if needed) — reserve disk space first
//   2. ConfigMap (Grafana+Prometheus only) — config files the container reads
//   3. Deployment — run the container
//   4. Service — expose it on localhost
//
// Each step calls the k8s API. If a resource already exists (e.g. you ran
// artemis twice), we skip creation rather than failing — that's the
// "if not exists" pattern from the original Python operator.

import { spawn } from 'child_process';
import {
  makePVC,
  makeDeployment,
  makeService,
  makeGrafanaDatasourceConfigMap,
  makeGrafanaDeploymentWithDatasource,
} from './manifests.js';

// pullImage — Pulls a Docker image to the local cache using the Docker CLI.
//
// Uses spawn (async child process) instead of execSync (blocking) so multiple
// images can be pulled in parallel — all downloads happen simultaneously.
//
// @param {string} image - e.g. "postgres:15"
// @returns {Promise} resolves when pull completes, rejects on failure
export function pullImage(image) {
  return new Promise((resolve, reject) => {
    // spawn starts docker pull as a separate process and returns immediately
    // stdio: 'pipe' suppresses docker's output so it doesn't break the Ink TUI
    const proc = spawn('docker', ['pull', image], { stdio: 'pipe' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker pull ${image} exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// deployService — Deploy one service end-to-end.
//
// @param {Object} clients         - from createK8sClient(): { appsV1Api, coreV1Api }
// @param {string} namespace       - k8s namespace to deploy into (usually "default")
// @param {Object} service         - service config from catalog.js
// @param {boolean} withPrometheus - true if Prometheus is also being deployed (for Grafana wiring)
// @returns {Object}               - { id, status: 'deployed'|'failed', error? }
export async function deployService(clients, namespace, service, withPrometheus = false) {
  const { appsV1Api, coreV1Api } = clients;

  // The k8s client throws errors in different shapes depending on the version.
  // This helper checks all known locations where a 409 status code might appear.
  const is409 = (e) =>
    e?.response?.statusCode === 409 ||
    e?.statusCode === 409 ||
    e?.body?.code === 409 ||
    (typeof e?.message === 'string' && e.message.includes('409')) ||
    (typeof e?.body === 'string' && e.body.includes('"code":409'));

  try {
    // ── Step 1: Create PVC (if this service needs persistent storage) ──────────
    if (service.pvc) {
      const pvc = makePVC(service.id, service.pvc.size);
      try {
        await coreV1Api.createNamespacedPersistentVolumeClaim({
          namespace,
          body: pvc,
        });
      } catch (e) {
        // 409 = "Conflict" = resource already exists. Safe to ignore — just skip.
        // Any other error code is a real problem, so we re-throw it.
        if (!is409(e)) throw e;
      }
    }

    // ── Step 2: Create Grafana datasource ConfigMap (only when wiring to Prometheus) ──
    if (service.id === 'grafana' && withPrometheus) {
      const cm = makeGrafanaDatasourceConfigMap();
      try {
        await coreV1Api.createNamespacedConfigMap({ namespace, body: cm });
      } catch (e) {
        if (!is409(e)) throw e;
      }
    }

    // ── Step 3: Create Deployment ───────────────────────────────────────────────
    // If Grafana + Prometheus are both selected, use the special deployment
    // that mounts the datasource ConfigMap — otherwise use the standard one.
    const deployment =
      service.id === 'grafana' && withPrometheus
        ? makeGrafanaDeploymentWithDatasource(service)
        : makeDeployment(service);

    try {
      await appsV1Api.createNamespacedDeployment({ namespace, body: deployment });
    } catch (e) {
      if (!is409(e)) throw e;
    }

    // ── Step 4: Create Service (NodePort) ───────────────────────────────────────
    const svc = makeService(service);
    try {
      await coreV1Api.createNamespacedService({ namespace, body: svc });
    } catch (e) {
      if (!is409(e)) throw e;
    }

    return { id: service.id, status: 'deployed' };

  } catch (err) {
    // Something unexpected went wrong — return the error so the UI can show it
    return { id: service.id, status: 'failed', error: err.message || String(err) };
  }
}

// teardownService — Delete all k8s resources for a service.
//
// Called by "artemis down". Deletes in reverse order:
// Service → Deployment → PVC (PVC last so data isn't wiped before the app stops)
//
// @param {Object} clients   - from createK8sClient()
// @param {string} namespace - k8s namespace
// @param {Object} service   - service config from catalog.js
export async function teardownService(clients, namespace, service) {
  const { appsV1Api, coreV1Api } = clients;
  const name = `artemis-${service.id}`;

  // Helper — ignore 404 (not found) errors during delete.
  // If the resource doesn't exist, we don't need to delete it.
  const ignore404 = (p) => p.catch(e => {
    if (e.response?.statusCode !== 404) throw e;
  });

  await ignore404(coreV1Api.deleteNamespacedService({ name: `${name}-svc`, namespace }));
  await ignore404(appsV1Api.deleteNamespacedDeployment({ name, namespace }));

  if (service.pvc) {
    await ignore404(coreV1Api.deleteNamespacedPersistentVolumeClaim({ name: `${name}-pvc`, namespace }));
  }

  if (service.id === 'grafana') {
    await ignore404(coreV1Api.deleteNamespacedConfigMap({ name: 'artemis-grafana-datasources', namespace }));
  }
}
