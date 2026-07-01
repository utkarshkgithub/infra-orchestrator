# Infra-orchestrator

> A simplified Vercel-like deployment system for static builds — built from scratch as a learning challenge.

[![Live](https://img.shields.io/badge/live-shipwebsite.tech-2ea44f?style=flat-square)](https://www.shipwebsite.tech/)
[![Stack](https://img.shields.io/badge/stack-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](#)
[![Infra](https://img.shields.io/badge/infra-AWS%20%2B%20Oracle%20Cloud-orange?style=flat-square&logo=amazonaws&logoColor=white)](#)
[![PRs](https://img.shields.io/badge/PRs-welcome-blueviolet?style=flat-square)](#contributing)

Push your code → infra-orchestrator clones it, builds it, and ships it to a global CDN. No magic, just queues, workers, and a healthy disrespect for your AWS bill.

🔗 **Live:** [shipwebsite.tech](https://www.shipwebsite.tech/)

---

##  What it does

infra-orchestrator takes a static project and deploys it end-to-end:

1. You trigger a deployment.
2. The backend pushes a job onto a queue.
3. A worker picks it up, clones the repo, runs the build.
4. The build output is pushed to S3 and served via CDN.

Currently supports **static builds only**. More build targets are planned.

##  Workflow

![Workflow](./assets/newworkflow.svg)

## Architecture & decisions

The whole system is designed around one constraint: **keep it cheap**.

- **Backend** runs on AWS Lambda — cheap, scales to zero, perfect for the API layer.
- **Builds** run on a spare Oracle Cloud worker instead of Lambda, since builds can exceed Lambda's runtime limits and EC2 wasn't free anymore.
- **Queueing** uses AWS SQS. The Oracle worker long-polls SQS for deployment jobs — simple, distributed, and SQS gives dedup + a dead-letter queue for free. RabbitMQ was considered but felt like overkill for this scale.
- **SQS + Lambda (Event Source Mapping)** was the more "managed" route, but skipped — deployments are multi-stage (clone → build → push to S3) and don't fit neatly into Lambda's short-lived execution model.
- **Delivery** — once the build lands in S3, it's served through AWS CloudFront's edge network.

If operational complexity grows later, RabbitMQ is the natural next step.

## Project structure

```
infra-orchestrator/
├── apps/
│   ├── backend      # API server
│   ├── executor     # Build worker (runs on Oracle Cloud)
│   ├── frontend     # Web UI (WIP)
│   └── scheduler    # Scheduled jobs (WIP)
├── packages/
│   └── shared       # Shared types & utilities
├── infra/           # AWS CDK infrastructure-as-code
├── nginx/           # Nginx config (WIP)
└── assets/          # Diagrams, etc.
```

## Tech stack

| Layer | Tech |
|---|---|
| Language | TypeScript |
| API | AWS Lambda |
| Build worker | Oracle Cloud (Node.js) |
| Queue | AWS SQS |
| Storage / CDN | AWS S3 + CloudFront |
| IaC | AWS CDK |
| Monorepo | pnpm workspaces |



> Infra (CDK stacks) lives in `infra/` — see that folder for deployment-specific setup.

## 🗺️ Roadmap

- [ ] Frontend dashboard for triggering & monitoring deployments
- [ ] Scheduler for periodic/cron-based jobs
- [ ] Support for non-static build targets
- [ ] Nginx-based routing layer

## 🤝 Contributing

This started as a learning project, but everybody is free to contribute. Open an issue, fork it, send a PR — all welcome.

<p align="center">Built with curiosity, SQS, and a refusal to pay for EC2.</p>