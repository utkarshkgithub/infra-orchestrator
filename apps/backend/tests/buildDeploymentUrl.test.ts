import { describe, expect, it } from "@jest/globals";

const { buildDeploymentUrl } = await import("../src/utils/buildDeploymentUrl.js");

describe("buildDeploymentUrl", () => {
  it("prefixes the cdn domain with https", () => {
    expect(buildDeploymentUrl("abc123.deploy.shipwebsite.tech")).toBe(
      "https://abc123.deploy.shipwebsite.tech",
    );
  });
});