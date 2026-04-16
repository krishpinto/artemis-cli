// catalog.js — The single source of truth for every service Artemis can deploy.
//
// Each object in this array describes one service completely:
//   - what to show in the TUI menu
//   - what Docker image to pull
//   - what ports to expose
//   - what environment variables the container needs
//   - whether it needs persistent storage (a PVC)
//   - what connection string to show after deploy
//
// To add a new service to Artemis, just add a new object here. Nothing else needs to change.

export const SERVICE_CATALOG = [
  {
    // "id" is used as the k8s resource name prefix: artemis-postgres, artemis-postgres-svc, etc.
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Relational database — the workhorse of most apps',
    // The Docker image to run. Same one used in the original Artemis operator.
    image: 'postgres:15',
    // containerPort: the port the app listens on INSIDE the container
    // nodePort: the fixed port exposed on your localhost (we fix this so the connection string never changes)
    ports: [{ containerPort: 5432, nodePort: 30432 }],
    // Environment variables passed into the container at startup
    env: [
      { name: 'POSTGRES_USER',     value: 'postgres' },
      { name: 'POSTGRES_PASSWORD', value: 'artemis' },
      { name: 'POSTGRES_DB',       value: 'artemis' },
      // PGDATA tells Postgres where to store its data files inside the container
      { name: 'PGDATA',            value: '/var/lib/postgresql/data/pgdata' },
    ],
    // pvc: true means this service needs a PersistentVolumeClaim — disk storage that survives pod restarts
    // Without this, all your data is wiped every time the container restarts
    pvc: { size: '1Gi', mountPath: '/var/lib/postgresql/data' },
    // The ready-to-use connection string shown after deploy
    connectionStrings: [
      'postgresql://postgres:artemis@localhost:30432/artemis',
    ],
  },

  {
    id: 'redis',
    name: 'Redis',
    description: 'In-memory cache and message broker',
    image: 'redis:7',
    ports: [{ containerPort: 6379, nodePort: 30379 }],
    env: [],
    pvc: { size: '1Gi', mountPath: '/data' },
    connectionStrings: [
      'redis://localhost:30379',
    ],
  },

  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Document database for flexible, JSON-like data',
    image: 'mongo:7',
    ports: [{ containerPort: 27017, nodePort: 30017 }],
    env: [
      { name: 'MONGO_INITDB_ROOT_USERNAME', value: 'artemis' },
      { name: 'MONGO_INITDB_ROOT_PASSWORD', value: 'artemis' },
      { name: 'MONGO_INITDB_DATABASE',      value: 'artemis' },
    ],
    pvc: { size: '1Gi', mountPath: '/data/db' },
    connectionStrings: [
      'mongodb://artemis:artemis@localhost:30017/artemis',
    ],
  },

  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    image: 'mysql:8',
    ports: [{ containerPort: 3306, nodePort: 30306 }],
    env: [
      { name: 'MYSQL_ROOT_PASSWORD', value: 'artemis' },
      { name: 'MYSQL_DATABASE',      value: 'artemis' },
      { name: 'MYSQL_USER',          value: 'artemis' },
      { name: 'MYSQL_PASSWORD',      value: 'artemis' },
    ],
    pvc: { size: '1Gi', mountPath: '/var/lib/mysql' },
    connectionStrings: [
      'mysql://artemis:artemis@localhost:30306/artemis',
    ],
  },

  {
    id: 'minio',
    name: 'MinIO',
    description: 'S3-compatible object storage — store files, images, backups',
    image: 'quay.io/minio/minio:latest',
    // MinIO exposes two ports: 9000 for the S3 API, 9001 for the web console
    ports: [
      { containerPort: 9000, nodePort: 30900 },
      { containerPort: 9001, nodePort: 30901 },
    ],
    env: [
      { name: 'MINIO_ROOT_USER',     value: 'artemis' },
      { name: 'MINIO_ROOT_PASSWORD', value: 'artemis123' },
    ],
    // MinIO needs a special startup command to enable the web console on port 9001
    args: ['server', '/data', '--console-address', ':9001'],
    pvc: null, // MinIO works fine without persistent storage for a dev setup
    connectionStrings: [
      'S3 API  → http://localhost:30900  (key: artemis / secret: artemis123)',
      'Console → http://localhost:30901  (user: artemis / pass: artemis123)',
    ],
  },

  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Metrics collection and monitoring engine',
    image: 'prom/prometheus:latest',
    ports: [{ containerPort: 9090, nodePort: 30090 }],
    env: [],
    pvc: null,
    connectionStrings: [
      'http://localhost:30090',
    ],
  },

  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Metrics dashboards — auto-connects to Prometheus if selected',
    image: 'grafana/grafana:latest',
    ports: [{ containerPort: 3000, nodePort: 30300 }],
    env: [
      { name: 'GF_SECURITY_ADMIN_PASSWORD', value: 'admin' },
      // Allow Grafana to be embedded in iframes — without this it sends X-Frame-Options: deny
      { name: 'GF_SECURITY_ALLOW_EMBEDDING', value: 'true' },
    ],
    pvc: null,
    connectionStrings: [
      'http://localhost:30300  (admin / admin)',
    ],
    // Special flag: if Prometheus is also selected, we inject a datasource config
    // so Grafana opens already connected — not empty like the previous version
    prometheusIntegration: true,
  },

  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    description: 'Message queue — decouple services with async messaging',
    // The "management" tag includes the web UI on port 15672
    image: 'rabbitmq:3-management',
    ports: [
      { containerPort: 5672,  nodePort: 30672 },  // AMQP protocol port
      { containerPort: 15672, nodePort: 30673 },  // Web management UI
    ],
    env: [
      { name: 'RABBITMQ_DEFAULT_USER', value: 'artemis' },
      { name: 'RABBITMQ_DEFAULT_PASS', value: 'artemis' },
    ],
    pvc: null,
    connectionStrings: [
      'amqp://artemis:artemis@localhost:30672',
      'Management UI → http://localhost:30673  (artemis / artemis)',
    ],
  },
];
