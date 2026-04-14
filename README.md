# Artemis 🚀

**One command. Launch your entire local dev stack.**

Artemis is a CLI tool that deploys production-grade local development infrastructure to Kubernetes — Postgres, Redis, MongoDB, Grafana, and more — with a single command. No YAML. No config files. No setup docs to follow.

Just run it, pick your services, and get copy-paste connection strings.

---

## Quick Start

```bash
npx artemis-cli
```

- Launches an interactive terminal UI
- Shows your available Kubernetes clusters
- Lets you pick which services to deploy
- Pulls images, deploys everything in parallel
- Gives you working connection strings the moment it's done

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled
  - Open Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply
- Node.js 18+

That's it.

---

## Commands

```bash
npx artemis-cli            # launch the TUI and deploy services
npx artemis-cli status     # see what's running + connection strings
npx artemis-cli down       # tear everything down
npx artemis-cli connect    # port-forward all services to localhost
npx artemis-cli ui         # open the Mission Control web dashboard
```

Or install globally for shorter commands:

```bash
npm install -g artemis-cli

artemis                    # launch the TUI
artemis status
artemis down
artemis connect
artemis ui
```

---

## Mission Control (Web UI)

Run `npx artemis-cli ui` to open a local web dashboard at `http://localhost:4000`:

- **Dashboard** — live status of all deployed services with connection strings
- **PostgreSQL** — browse tables and run SQL queries in the browser
- **Redis** — browse keys, view values by type, add and delete keys
- **MongoDB** — browse collections and inspect documents as JSON
- **Docs** — copy-paste connection snippets for Node.js, Python, Prisma, Mongoose

---

## Services

| Service      | Description                        | Port  |
|--------------|------------------------------------|-------|
| PostgreSQL   | Relational database                | 5432  |
| Redis        | In-memory cache / message broker   | 6379  |
| MongoDB      | Document database                  | 27017 |
| MySQL        | Relational database                | 3306  |
| MinIO        | S3-compatible object storage       | 9000  |
| Prometheus   | Metrics collection                 | 9090  |
| Grafana      | Metrics dashboards                 | 3000  |
| RabbitMQ     | Message queue                      | 5672  |

---

## How it works

1. You pick services from the interactive menu
2. Artemis pulls the Docker images locally (parallel, fast)
3. Deploys them as Kubernetes workloads with persistent storage
4. Exposes each service on a fixed port via NodePort + port-forwarding
5. Prints connection strings — ready to paste into your app

All services use `imagePullPolicy: IfNotPresent` so once pulled, deploys are instant.

---

## Built with

- [Ink](https://github.com/vadimdemedes/ink) — React for CLIs
- [@kubernetes/client-node](https://github.com/kubernetes-client/javascript) — Kubernetes JS client
- [Next.js](https://nextjs.org/) — web dashboard
- [esbuild](https://esbuild.github.io/) — bundler

---

Built by [Krish Pinto](https://github.com/krishpinto)
