// previews.service.ts
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";

export async function generateProjectPreview(projectId: number, deploymentId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      publicId: true,
      previewUrl: true,
      deployments: {
        orderBy: { id: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!project) return;

  // stale deployment check
  const latestDeploymentId = project.deployments[0]?.id;
  if (latestDeploymentId !== deploymentId) return;

  const siteUrl =
  `https://${project.publicId}.deploy.shipwebsite.tech`;

  const microlinkUrl =
    `https://api.microlink.io?url=${encodeURIComponent(siteUrl)}` +
    `&screenshot=true&meta=false`;

  const res = await fetch(microlinkUrl);
  if (!res.ok) return;

  const json = await res.json();
  const previewUrl = json?.data?.screenshot?.url;

  if (!previewUrl) return;

  await prisma.project.update({
    where: { id: projectId },
    data: { previewUrl },
  });
}