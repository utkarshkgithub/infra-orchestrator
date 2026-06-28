import LogoLoop from "./LogoLoop";

import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiNodedotjs,
  SiExpress,
  SiDocker,
  SiGit,
  SiGithub,
  SiTerraform,
  SiNginx,
  SiLinux,
  SiMongodb,
  SiPostgresql
} from "react-icons/si";

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <SiNodedotjs />, title: "Node.js", href: "https://nodejs.org" },
  { node: <SiExpress />, title: "Express", href: "https://expressjs.com" },
  { node: <SiDocker />, title: "Docker", href: "https://www.docker.com" },
  { node: <SiTerraform />, title: "Terraform", href: "https://www.terraform.io" },
  { node: <SiGit />, title: "Git", href: "https://git-scm.com" },
  { node: <SiGithub />, title: "GitHub", href: "https://github.com" },
  { node: <SiLinux />, title: "Linux", href: "https://kernel.org" },
  { node: <SiNginx />, title: "Nginx", href: "https://nginx.org" },
  { node: <SiMongodb />, title: "MongoDB", href: "https://www.mongodb.com" },
  { node: <SiPostgresql />, title: "PostgreSQL", href: "https://www.postgresql.org" },
];


export default function LogoStrip() {
  return (
    <div style={{ height: "200px", position: "relative", overflow: "hidden" }}>
      {/* Basic horizontal loop */}
      <LogoLoop
        logos={techLogos}
        speed={100}
        direction="left"
        logoHeight={50}
        gap={60}
        hoverSpeed={20}
        scaleOnHover
        fadeOutColor="#000000"
        ariaLabel="Technology stack"
      />

    </div>
  );
}
