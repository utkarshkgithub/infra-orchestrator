import { jest } from "@jest/globals";

type Mock<T = any> = jest.Mock<T, any[]>;

interface PrismaMock {
  user: {
    findUnique: Mock<Promise<any>>;
    upsert: Mock<Promise<any>>;
  };
  project: {
    findUnique: Mock<Promise<any>>;
    findFirst: Mock<Promise<any>>;
    findMany: Mock<Promise<any>>;
    create: Mock<Promise<any>>;
    update: Mock<Promise<any>>;
  };
  deployment: {
    findUnique: Mock<Promise<any>>;
    findFirst: Mock<Promise<any>>;
    findMany: Mock<Promise<any>>;
    create: Mock<Promise<any>>;
    update: Mock<Promise<any>>;
  };
}

export function mockPrisma(): PrismaMock {
  return {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    deployment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

export const sampleProject = {
  id: 1,
  userId: 1,
  publicId: "abc123",
  name: "demo",
  repoUrl: "https://github.com/utkarsh/demo-repo",
  rootDir: "/",
  installCmd: "npm install",
  buildCmd: "npm run build",
  outputDir: "dist",
  framework: null,
  envVars: {},
};

export const sampleDeployment = {
  id: 10,
  projectId: 1,
  status: "pending",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};