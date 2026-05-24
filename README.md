# infra-orchestrator

What i decided to do is to challenge myself into building something like vercel on simpler scale.

This will work on static builds only right now.

If i later decide to add more features on this , you will see it here!!


![alt text](assets/workflow.svg)

## Working Flow


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