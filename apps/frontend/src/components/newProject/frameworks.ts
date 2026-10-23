/**
 * Framework definitions — single source of truth for all framework presets.
 * Import into FrameworkPicker and NewProjectPage.
 */

export interface FrameworkDef {
  id: string;
  label: string;
  installCmd: string;
  buildCmd: string;
  outputDirSuffix: string;
  color: string;
}

export const FRAMEWORKS: FrameworkDef[] = [
  { id: "react",   label: "React (Vite)",                  installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "dist", color: "#61DAFB" },
  { id: "vue",     label: "Vue (Vite)",                    installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "dist", color: "#42B883" },
  { id: "angular", label: "Angular",                       installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "dist", color: "#DD0031" },
  { id: "svelte",  label: "Svelte",                        installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "build", color: "#FF3E00" },
  { id: "solid",   label: "Solid",                         installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "dist", color: "#2C4F7C" },
  { id: "astro",   label: "Astro",                         installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "dist", color: "#FF5D01" },
  { id: "next",    label: "Next.js (static export)",       installCmd: "npm install", buildCmd: "npm run build", outputDirSuffix: "out",  color: "#000000" },
];

export const FRAMEWORK_MAP = Object.fromEntries(FRAMEWORKS.map((f) => [f.id, f]));
