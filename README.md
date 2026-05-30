# infra-orchestrator

What i decided to do is to challenge myself into building something like vercel on simpler scale.

This will work on static builds only right now.

If i later decide to add more features on this , you will see it here!!


![alt text](assets/workflow.svg)

## Working Flow

## Architectural Decisions
i have decided to go with the low cost deploy architecture as i would love to save my money , so for backend i choose aws lambda in production as server and now to create deployments i needed longer duration workers aws lambda could do the job if the build was within its runtime limit but i prefered to use oracle cloud worker which i had a instance just rotting away , i could have used ec2 here but i am out of free credits , now to create a truly distributed highly scable model sqs was the easier choice here as all i had to do was to push deployment message in sqs and my oracle worker would long poll it to read the message , preventing deduplication and implementing dlq is also easier and more optimal, the other option was rabbitMQ but felt like a overkill if the operational complexity need is increased would go after rabbitMQ . 
Also the alternate to this model worker is using SQS + ESM(Event Source Mapping) + lambda worker  which is basically like a managed polling service by aws.
Operational complexity of this model is very low despite that for the earlier stated reason i.e deployment process is multistage process like cloning + building+ pushing production code to s3 bucket takes time . And After all the build s3 code is served with the aws cdn edge network.

## Directory Tree
/apps
  /backend
    /src
      /modules
        /auth
          auth.controller.ts
          auth.service.ts
          auth.routes.ts
          auth.types.ts

        /projects
          projects.controller.ts
          projects.service.ts
          projects.routes.ts
          projects.types.ts

        /deployments
          deployments.controller.ts
          deployments.service.ts
          deployments.routes.ts
          deployments.types.ts

        /webhooks
          github-webhook.controller.ts
          github-webhook.service.ts
          github-webhook.routes.ts

      /lib
        prisma.ts
        sqs.ts
        github.ts
        logger.ts
        env.ts

      /middleware
        auth.middleware.ts
        error.middleware.ts
        validate.middleware.ts

      /utils
        generateDeploymentId.ts
        buildDeploymentUrl.ts
        hash.ts

      /types
        express.d.ts
        common.types.ts

      app.ts
      server.ts

    package.json
    tsconfig.json
    .env

## src/server.ts

Purpose:
Actual process entrypoint.

Typical:

import app from "./app";

app.listen(3000);

Responsibility:

boot server
DB init
env validation
startup logging

## src/app.ts

Purpose:
Configure the Express app.

Typical contents:

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);

export default app;

Responsibility:

middleware registration
route registration
app configuration

No listen() here.