import { describe, expect, it, jest } from "@jest/globals";

jest.unstable_mockModule("../src/lib/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const { emitMetric } = await import("../src/lib/metrics.js");
const { logger } = await import("../src/lib/logger.js");

const mockedLogger = logger as unknown as { info: jest.Mock };

describe("emitMetric", () => {
  it("logs a structured metric line with dimensions", () => {
    emitMetric("deployment.success", 1, { deploymentId: 10 });

    expect(mockedLogger.info).toHaveBeenCalledWith(
      {
        type: "metric",
        metric: "deployment.success",
        value: 1,
        dimensions: { deploymentId: 10 },
      },
      "metric:deployment.success",
    );
  });

  it("defaults dimensions to an empty object", () => {
    emitMetric("job.queued", 1);

    const payload = (mockedLogger.info as jest.Mock).mock.calls[0][0];
    expect(payload.dimensions).toEqual({});
  });
});