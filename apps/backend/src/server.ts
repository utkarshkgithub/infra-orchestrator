import { env } from "./lib/env.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
    },
    "backend started",
  );
});
