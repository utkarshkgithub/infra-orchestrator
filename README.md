# infra-orchestrator

A simplified Vercel-like deployment system for static builds.

This project is built as a learning challenge. For now, it supports static builds only. Future features may be added later.

## Workflow
![Workflow](assets/workflow.svg)

## Architectural Decisions

I have decided to go with the low cost deploy architecture as I would love to save my money. For backend I chose AWS Lambda in production as the server, and to create deployments I needed longer duration workers. AWS Lambda could do the job if the build was within its runtime limit, but I preferred to use an Oracle Cloud worker which I had just rotting away. I could have used EC2 here, but I am out of free credits.

To create a truly distributed and highly scalable model, SQS was the easier choice as all I had to do was push deployment messages into SQS and my Oracle worker would long poll it to read them. Preventing deduplication and implementing a DLQ is also easier and more optimal. The other option was RabbitMQ, but it felt like overkill. If the operational complexity increases in the future, I would consider RabbitMQ instead.

Another alternative to this model is using SQS + Event Source Mapping (ESM) + Lambda workers, which is essentially a managed polling service by AWS. The operational complexity of this managed model is very low, but I chose not to use it because the deployment process is multi-stage—cloning, building, and pushing production code to S3—which can take time. After the build completes, the S3-hosted code is served through the AWS CDN edge network.

## Directory Structure

```text

├── apps
│   ├── backend      # API server
│   ├── executor     # Build worker
│   ├── frontend     # Web UI (Not implemented rn)
│   └── scheduler    # Scheduled jobs (Not implemented rn)
├── assets
│   └── workflow.svg
├── infra            # AWS CDK infrastructure
├── nginx            # Nginx configuration (Not implemented rn)
├── packages
│   └── shared       # Shared types and utilities
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Recent issue i faced:
i tried to do uuid for deployment id which was not only inefficient for the db indexing but also was too long , so instead of it i used like a crypto library to generate 8 byte then convert it to hex, sounded good to me but now i faced the next issue which was like i thought of hosting to s3 but s3 cannot do caching or edge distributions so i had to use cloudfront , now for react like frontends /deployment is not actually resouce to fetch from the s3 bucket it just part of the url thats all while serving index.html only , but for traditional build /dashboard.html would likely be to fetch that specific file and show it the users , to achive this functionality i used cloudfront funtions.

Next issue i am facing rn is my worker i am currently instally fresh packages for each deployment which i beleive i can cache.

Also for my static build rollback is like tooo easy all i gotta do is provide previous deployment url , now i should also restrict access to previous deployement after rollback but that can be done like either i have to restrict public access to that specific resource in the aws which will be ugly to code probably or remove the current deployment entirely too aggressive , for simplicity i am avoiding both options and even after rollback new url would be fine.

Next issue i faced was not handling the preflight request correcly in the backend auth endpoints as preflight request did not contain the token , response was 404 and the main request did not succeed, to handle this i add early exit for options method in the express auth middleware. 
Also right now i am using http true for the auth cookies to prevent xss attack

Next i have these tasks:
allow for custom domain names, check for Idempotency for some endpoints, introduce rate limits on api gateway

⭐ the repo if you like this project !!