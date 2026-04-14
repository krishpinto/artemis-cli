// manifests.js — Functions that build Kubernetes resource objects.
//
// Kubernetes resources are just JSON objects with a specific structure.
// These functions take a service config from catalog.js and return the
// correct k8s objects for that service.
//
// This is ported from the original Artemis Python operator (k8s_operator.py),
// where the same pattern was used with Python dicts. Same logic, different language.
//
// The three resources we create per service:
//   makePVC()        → reserves persistent disk storage (only for services that need it)
//   makeDeployment() → tells k8s to run the container
//   makeService()    → exposes the container on a fixed port on your machine

// makePVC — Creates a PersistentVolumeClaim for a service.
//
// A PVC is a request for storage. k8s provisions the actual disk and binds it.
// Once created, the storage survives pod restarts — your Postgres data doesn't
// disappear every time the container reboots.
//
// @param {string} serviceName - e.g. "postgres" → creates "artemis-postgres-pvc"
// @param {string} size        - e.g. "1Gi"
export function makePVC(serviceName, size) {
  return {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      // Naming convention: artemis-{service}-pvc
      // Consistent naming makes it easy to find and delete resources later
      name: `artemis-${serviceName}-pvc`,
    },
    spec: {
      // ReadWriteOnce: only one pod can mount this volume at a time
      // Fine for all our services — they each run as a single pod
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: { storage: size },
      },
    },
  };
}

// makeDeployment — Creates a k8s Deployment for a service.
//
// A Deployment tells k8s: "run this container, with these env vars, on these ports,
// and mount this volume if needed. Keep it running — if it crashes, restart it."
//
// @param {Object} service - a service config object from catalog.js
export function makeDeployment(service) {
  const name = `artemis-${service.id}`;

  // Build the container port list from the service catalog
  const containerPorts = service.ports.map(p => ({
    containerPort: p.containerPort,
  }));

  // Build the env var list — k8s expects [{ name: string, value: string }]
  const env = service.env || [];

  // Volume configuration — only added if the service has a PVC
  const volumeMounts = service.pvc
    ? [{ name: 'data', mountPath: service.pvc.mountPath }]
    : [];

  const volumes = service.pvc
    ? [{ name: 'data', persistentVolumeClaim: { claimName: `${name}-pvc` } }]
    : [];

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name },
    spec: {
      // replicas: 1 means run exactly one copy of this container
      // For dev infrastructure you only ever need one
      replicas: 1,
      selector: {
        matchLabels: { app: name },
      },
      template: {
        metadata: {
          labels: { app: name },
        },
        spec: {
          containers: [
            {
              name,
              image: service.image,
              // IfNotPresent = use the locally cached image if it exists, only pull if missing.
              // This means we must docker pull before deploying — which we do in the Deploying screen.
              // Without this, k8s always tries to pull from Docker Hub, which can fail due to rate limits.
              imagePullPolicy: 'IfNotPresent',
              ports: containerPorts,
              env,
              // Only include volumeMounts if there's storage to mount
              ...(volumeMounts.length > 0 && { volumeMounts }),
              // Some services (like MinIO) need custom startup args
              ...(service.args && { args: service.args }),
            },
          ],
          // Only include volumes if there's a PVC to reference
          ...(volumes.length > 0 && { volumes }),
        },
      },
    },
  };
}

// makeService — Creates a k8s Service (NodePort) that exposes the container on your machine.
//
// By default, a pod running in k8s is completely isolated — you can't reach it from outside the cluster.
// A Service punches a hole through: it maps a port on your localhost (nodePort) to the container's port.
//
// We use NodePort type (not ClusterIP) because Docker Desktop exposes NodePort services on localhost.
// We hardcode the nodePort values (30432, 30379, etc.) so connection strings are always the same.
//
// @param {Object} service - a service config object from catalog.js
export function makeService(service) {
  const name = `artemis-${service.id}`;

  // Each port in the catalog becomes a port mapping in the Service
  const ports = service.ports.map(p => ({
    port: p.containerPort,       // port inside the cluster (other pods use this)
    targetPort: p.containerPort, // port on the container itself
    nodePort: p.nodePort,        // port on your localhost — this is what you connect to
    protocol: 'TCP',
  }));

  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name: `${name}-svc` },
    spec: {
      // NodePort: accessible from outside the cluster via localhost:nodePort
      type: 'NodePort',
      // selector links the Service to the Deployment — it finds pods with this label
      selector: { app: name },
      ports,
    },
  };
}

// makeGrafanaDatasourceConfigMap — Creates a ConfigMap that pre-configures Grafana's Prometheus datasource.
//
// A ConfigMap is a k8s object for storing config files. Grafana reads datasource configs
// from a specific directory on startup. By mounting this ConfigMap into that directory,
// Grafana auto-connects to Prometheus — no manual setup needed.
//
// This only gets created when both Grafana AND Prometheus are selected.
export function makeGrafanaDatasourceConfigMap() {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: { name: 'artemis-grafana-datasources' },
    data: {
      // The filename matters — Grafana scans for .yaml files in this provisioning directory
      'prometheus.yaml': `
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    # "artemis-prometheus-svc" is the k8s DNS name of the Prometheus Service.
    # Inside the cluster, services are reachable by their name — no IP needed.
    url: http://artemis-prometheus-svc:9090
    isDefault: true
`,
    },
  };
}

// makeGrafanaDeploymentWithDatasource — A modified Grafana Deployment that mounts the datasource ConfigMap.
//
// When both Grafana and Prometheus are selected, we use this instead of the standard makeDeployment().
// It adds an extra volumeMount and volume that point to the ConfigMap above.
export function makeGrafanaDeploymentWithDatasource(service) {
  // Start with the standard deployment
  const base = makeDeployment(service);
  const container = base.spec.template.spec.containers[0];

  // Mount the ConfigMap into Grafana's provisioning directory
  container.volumeMounts = [
    ...(container.volumeMounts || []),
    {
      name: 'datasources',
      mountPath: '/etc/grafana/provisioning/datasources',
    },
  ];

  base.spec.template.spec.volumes = [
    ...(base.spec.template.spec.volumes || []),
    {
      name: 'datasources',
      configMap: { name: 'artemis-grafana-datasources' },
    },
  ];

  return base;
}
